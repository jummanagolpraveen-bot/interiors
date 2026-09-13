import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getVisionProvider, ProviderNotConfiguredError } from '@/lib/ai/provider'
import { checkUsageLimit, UsageLimitExceededError } from '@/lib/ai/usage'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId } = await req.json()
    if (!roomId) return NextResponse.json({ error: 'Room ID required' }, { status: 400 })

    try {
      await checkUsageLimit(supabase, user.id, 'analysis')
    } catch (e: any) {
      if (e instanceof UsageLimitExceededError) {
        return NextResponse.json({ error: 'UsageLimitExceeded', message: e.message }, { status: 403 })
      }
      throw e
    }

    // Get room and original image
    const { data: room } = await supabase
      .from('rooms')
      .select('*, room_images(*)')
      .eq('id', roomId)
      .single()

    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const image = room.room_images.find((img: any) => img.type === 'original')
    if (!image) return NextResponse.json({ error: 'Original image not found' }, { status: 404 })

    let visionProvider
    try {
      visionProvider = getVisionProvider()
    } catch (e: any) {
      if (e instanceof ProviderNotConfiguredError) {
        return NextResponse.json({ error: 'ProviderNotConfigured', message: e.message }, { status: 503 })
      }
      throw e
    }

    const analysisResult = await visionProvider.analyze([image.image_url], room)

    // Save Analysis to DB
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        room_id: roomId,
        overall_score: analysisResult.overall_score,
        status: 'completed',
        raw_ai_response: analysisResult
      })
      .select()
      .single()

    if (analysisError) throw analysisError

    // Save Scores (Phase 3 Maps details to standard columns)
    const { details, detailed_recommendations } = analysisResult

    // Save Recommendations based on new detailed_recommendations structure
    if (detailed_recommendations && detailed_recommendations.length > 0) {
      const recsToInsert = detailed_recommendations.map((rec) => ({
        analysis_id: analysisData.id,
        category: rec.category,
        suggestion: rec.suggestion,
        reasoning: rec.reasoning
      }))
      await supabase.from('recommendations').insert(recsToInsert)
    } else {
      // Fallback if not provided
      const recsToInsert = Object.entries(details).map(([category, detail]) => ({
        analysis_id: analysisData.id,
        category,
        suggestion: detail.improvement,
        reasoning: detail.ai_recommendation
      }))
      if (recsToInsert.length > 0) {
        await supabase.from('recommendations').insert(recsToInsert)
      }
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'analysis',
      metadata: { room_id: roomId, provider: 'openai' }
    })

    return NextResponse.json({ success: true, analysisId: analysisData.id })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
