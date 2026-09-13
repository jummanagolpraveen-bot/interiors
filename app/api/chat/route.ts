import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, language, projectId } = await req.json()
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    let sessionId = null

    // Find or create active chat session for this project
    if (projectId) {
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (session) {
        sessionId = session.id
      } else {
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.id, project_id: projectId })
          .select()
          .single()
        sessionId = newSession?.id
      }
    } else {
      // General chat session
      const { data: newSession } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id })
        .select()
        .single()
      sessionId = newSession?.id
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      chat_session_id: sessionId,
      role: 'user',
      content: message
    })

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: 'chat_message',
      metadata: { session_id: sessionId }
    })

    // Retrieve last 5 messages for context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('chat_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(6) // Including the one we just inserted

    const messagesForAI = (history || []).reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = `You are InteriaAI Assistant, a highly skilled professional interior design assistant. You help users with their room design, remodeling, budgeting, and styling.
Be concise, friendly, and highly practical.
You must respond in ${language || 'English'}.`

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messagesForAI
      ]
    })

    const reply = aiResponse.choices[0].message.content

    // Save assistant message
    await supabase.from('chat_messages').insert({
      chat_session_id: sessionId,
      role: 'assistant',
      content: reply
    })

    return NextResponse.json({ success: true, reply })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
