import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { designId } = await req.json()
    if (!designId) return NextResponse.json({ error: 'Design ID required' }, { status: 400 })

    const { data: saved, error } = await supabase
      .from('saved_designs')
      .insert({
        user_id: user.id,
        generation_id: designId,
        notes: ''
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - already saved
        return NextResponse.json({ success: true, message: 'Already saved' })
      }
      throw error
    }

    return NextResponse.json({ success: true, savedId: saved.id })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
