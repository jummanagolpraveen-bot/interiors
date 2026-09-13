'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function Assistant({ projectId }: { projectId?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  
  const { language } = useLanguage()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Voice recognition setup
  const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null
  const recognition = SpeechRecognition ? new SpeechRecognition() : null
  
  if (recognition) {
    recognition.continuous = false
    recognition.interimResults = false
    
    // Map language context to recognition lang code if needed, simplified here
    recognition.lang = language === 'English' ? 'en-US' : (language === 'Hindi' ? 'hi-IN' : 'en-US') 

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + ' ' + transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }
  }

  const toggleListen = () => {
    if (!recognition) {
      alert('Voice input is not supported in this browser.')
      return
    }
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, language, projectId })
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:bg-primary/90 transition-transform ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between p-4 bg-primary text-white">
            <div className="font-semibold">InteriaAI Assistant</div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-500 mt-10 space-y-2">
                <p>Hello! I'm your AI interior design assistant.</p>
                <p>You can ask me questions about your current project, budget, or design styles.</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white border rounded-tl-none text-gray-800'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t">
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={toggleListen}
                className={`p-2 rounded-full flex-shrink-0 transition-colors ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title="Voice Input"
              >
                {isListening ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <Input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={`Ask in ${language}...`}
                className="flex-1 bg-gray-50 border-0 focus-visible:ring-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || loading} className="flex-shrink-0 h-10 w-10 rounded-full">
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
