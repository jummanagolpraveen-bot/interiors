import { RoomAnalysis, RoomAnalysisSchema } from './schemas'
import OpenAI from 'openai'

export interface VisionAnalysisProvider {
  analyze(images: string[], context?: any): Promise<RoomAnalysis>;
  healthCheck(): Promise<boolean>;
}

export class MockVisionAnalysisProvider implements VisionAnalysisProvider {
  async analyze(images: string[], context?: any): Promise<RoomAnalysis> {
    const mockDetail = {
      score: 85,
      rating: "Good" as const,
      explanation: "Mock explanation.",
      strength: "Mock strength.",
      improvement: "Mock improvement.",
      ai_recommendation: "Mock recommendation."
    }
    return {
      overall_score: 85,
      details: {
        space_utilization: mockDetail,
        lighting: mockDetail,
        color_harmony: mockDetail,
        furniture_layout: mockDetail,
        storage: mockDetail,
        style_consistency: mockDetail,
      },
      detailed_recommendations: [
        { category: "Furniture", suggestion: "Add sofa", reasoning: "More seating" }
      ]
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

export class OpenAIVisionProvider implements VisionAnalysisProvider {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async analyze(images: string[], context?: any): Promise<RoomAnalysis> {
    if (!images || images.length === 0) throw new Error('No images provided for analysis.')

    let contextString = ''
    if (context) {
      contextString = `\nContext:\nRoom Type: ${context.room_type || 'Unknown'}\nDimensions: ${context.length || '?'}x${context.width || '?'}ft\nStyle: ${context.preferred_style || 'Any'}\nPalette: ${(context.color_preferences || []).join(', ')}\nBudget: ${context.budget_range || 'Unknown'}\n`
    }

    const promptText = `
You are an expert interior designer. Analyze the provided room image and provide a highly detailed, objective score (0-100) across various categories. Be critical but constructive.
For each category, provide a rating strictly from this list: ["Excellent", "Good", "Could Be Improved", "Needs Attention"].
Provide a detailed explanation, a key strength, a specific improvement, and an actionable AI recommendation. Use professional wording. Never call a customer's home "bad".

Also, generate highly specific recommendations based on the room context and image. Provide exactly one recommendation for each of these categories if applicable: Furniture, Lighting, Wall color, Flooring, Curtains, Storage, Decor, Plants, Wall art, Ceiling, Layout.
Explain exactly why each recommendation is useful.
${contextString}

Respond in JSON format precisely matching this schema:
{
  "overall_score": number,
  "details": {
    "space_utilization": {
      "score": number,
      "rating": "Excellent" | "Good" | "Could Be Improved" | "Needs Attention",
      "explanation": string,
      "strength": string,
      "improvement": string,
      "ai_recommendation": string
    },
    // Repeat for: "lighting", "color_harmony", "furniture_layout", "storage", "style_consistency"
  },
  "detailed_recommendations": [
    {
      "category": "Furniture" | "Lighting" | "Wall color" | "Flooring" | "Curtains" | "Storage" | "Decor" | "Plants" | "Wall art" | "Ceiling" | "Layout",
      "suggestion": string,
      "reasoning": string
    }
  ]
}
`

    const content: any[] = [
      { type: 'text', text: promptText.trim() }
    ]

    for (const img of images) {
      content.push({ type: 'image_url', image_url: { url: img } })
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content
        }
      ],
      response_format: { type: 'json_object' },
    })

    const resultText = response.choices[0].message.content
    if (!resultText) {
      throw new Error('Failed to parse AI response.')
    }

    const parsed = JSON.parse(resultText)
    return RoomAnalysisSchema.parse(parsed)
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.openai.models.list()
      return true
    } catch {
      return false
    }
  }
}
