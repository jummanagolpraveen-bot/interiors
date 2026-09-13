import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getImageGenerationProvider, ProviderNotConfiguredError } from '@/lib/ai/provider'
import { checkUsageLimit, UsageLimitExceededError } from '@/lib/ai/usage'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId, intensity, styleOverride, paletteOverride } = await req.json()
    if (!roomId) return NextResponse.json({ error: 'Room ID required' }, { status: 400 })

    try {
      await checkUsageLimit(supabase, user.id, 'generation')
    } catch (e: any) {
      if (e instanceof UsageLimitExceededError) {
        return NextResponse.json({ error: 'UsageLimitExceeded', message: e.message }, { status: 403 })
      }
      throw e
    }

    const { data: room } = await supabase.from('rooms').select('*, project:projects(budget_band)').eq('id', roomId).single()
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const { data: image } = await supabase.from('room_images').select('image_url').eq('room_id', roomId).eq('type', 'original').single()
    if (!image) return NextResponse.json({ error: 'Original image not found' }, { status: 404 })

    let imageGen
    try {
      imageGen = getImageGenerationProvider()
    } catch (e: any) {
      if (e instanceof ProviderNotConfiguredError) {
        return NextResponse.json({ error: 'ProviderNotConfigured', message: e.message }, { status: 503 })
      }
      throw e
    }

    const prompt = `Redesign this ${room.room_type} in a ${styleOverride || room.preferred_style} style, focusing on a ${paletteOverride || room.color_preferences.join(' ')} color palette. ${intensity}.`
    const generatedUrls = await imageGen.generate(image.image_url, prompt)

    // Save generated image
    const { data: designData, error: designError } = await supabase
      .from('design_generations')
      .insert({
        room_id: roomId,
        generated_image_url: generatedUrls[0],
        prompt_used: prompt
      })
      .select()
      .single()

    if (designError) throw designError

    // Also add to room_images
    await supabase.from('room_images').insert({
      room_id: roomId,
      image_url: generatedUrls[0],
      type: 'generated'
    })

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'generation',
      metadata: { room_id: roomId, provider: 'replicate' }
    })

    return NextResponse.json({ success: true, designId: designData.id, imageUrl: generatedUrls[0], originalUrl: image.image_url })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
