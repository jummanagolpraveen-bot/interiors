import { z } from 'zod'

export const DetailSchema = z.object({
  score: z.number().min(0).max(100),
  rating: z.enum(["Excellent", "Good", "Could Be Improved", "Needs Attention"]),
  explanation: z.string(),
  strength: z.string(),
  improvement: z.string(),
  ai_recommendation: z.string(),
})

export const DetailedRecommendationSchema = z.object({
  category: z.enum([
    "Furniture", "Lighting", "Wall color", "Flooring", 
    "Curtains", "Storage", "Decor", "Plants", 
    "Wall art", "Ceiling", "Layout"
  ]),
  suggestion: z.string(),
  reasoning: z.string()
})

export const RoomAnalysisSchema = z.object({
  overall_score: z.number().min(0).max(100),
  details: z.object({
    space_utilization: DetailSchema,
    lighting: DetailSchema,
    color_harmony: DetailSchema,
    furniture_layout: DetailSchema,
    storage: DetailSchema,
    style_consistency: DetailSchema,
  }),
  detailed_recommendations: z.array(DetailedRecommendationSchema).optional()
})

export type RoomAnalysis = z.infer<typeof RoomAnalysisSchema>

export const RecommendationSchema = z.object({
  category: z.string(),
  suggestion: z.string(),
  reasoning: z.string(),
})

export type Recommendation = z.infer<typeof RecommendationSchema>
