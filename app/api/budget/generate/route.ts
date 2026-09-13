import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId, qualityLevel } = await req.json()
    if (!roomId) return NextResponse.json({ error: 'Room ID required' }, { status: 400 })

    const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const promptText = `
You are an expert interior design estimator. Provide a highly detailed, line-item budget estimate for a ${room.room_type}.
Room dimensions: ${room.length} x ${room.width} ft.
Quality level: ${qualityLevel || 'Standard'}.
Style: ${room.preferred_style}.

Generate cost estimates in USD. Ensure the total makes sense for the quality level. 
Respond in JSON format precisely matching this schema:
{
  "total_min": number,
  "total_max": number,
  "items": [
    {
      "category": "Civil work" | "Painting" | "Electrical" | "Lighting" | "Furniture" | "Carpentry" | "Flooring" | "Curtains" | "Decor" | "False ceiling",
      "min_cost": number,
      "max_cost": number,
      "description": string
    }
  ]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: promptText }],
      response_format: { type: 'json_object' }
    })

    const parsed = JSON.parse(response.choices[0].message.content!)

    // Save Budget Estimate to DB
    const { data: estimateData, error: estError } = await supabase
      .from('budget_estimates')
      .insert({
        project_id: room.project_id,
        room_id: room.id,
        quality_level: qualityLevel || 'Standard',
        total_min: parsed.total_min,
        total_max: parsed.total_max
      })
      .select()
      .single()

    if (estError) throw estError

    const itemsToInsert = parsed.items.map((item: any) => ({
      budget_estimate_id: estimateData.id,
      category: item.category.toLowerCase().replace(' ', '_'),
      min_amount: item.min_cost,
      max_amount: item.max_cost
    }))

    await supabase.from('budget_items').insert(itemsToInsert)

    return NextResponse.json({ success: true, estimateId: estimateData.id })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
