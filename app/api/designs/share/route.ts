import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { designId } = await req.json()
    if (!designId) return NextResponse.json({ error: 'Design ID required' }, { status: 400 })

    // Check if already shared
    const { data: existing } = await supabase.from('shared_designs').select('*').eq('design_generation_id', designId).single()
    if (existing) {
      return NextResponse.json({ success: true, shareToken: existing.share_token })
    }

    const token = crypto.randomBytes(16).toString('hex')
    
    const { data: shareData, error } = await supabase
      .from('shared_designs')
      .insert({
        design_generation_id: designId,
        share_token: token
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, shareToken: shareData.share_token })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
