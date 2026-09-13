'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export default function AnalyzeRoomPage() {
  const { id } = useParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<'analyzing' | 'done' | 'error' | 'not_configured' | 'limit_reached'>('analyzing')
  const [errorMessage, setErrorMessage] = useState('')
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])

  useEffect(() => {
    const analyze = async () => {
      try {
        const res = await fetch('/api/rooms/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: id })
        })
        const data = await res.json()
        if (res.status === 403) {
          setErrorMessage(data.message)
          setStatus('limit_reached')
          return
        }
        if (res.status === 503) {
          setErrorMessage(data.message)
          setStatus('not_configured')
          return
        }
        if (data.error) throw new Error(data.error)
        
        // Fetch saved results
        const { data: analysis } = await supabase
          .from('analyses')
          .select('*')
          .eq('id', data.analysisId)
          .single()

        const { data: recs } = await supabase
          .from('recommendations')
          .select('*')
          .eq('analysis_id', data.analysisId)

        setAnalysisData(analysis)
        setRecommendations(recs || [])
        setStatus('done')
      } catch (err) {
        console.error(err)
        setStatus('error')
      }
    }
    analyze()
  }, [id])

  if (status === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Spinner className="w-8 h-8 text-primary" />
        <h2 className="text-xl font-medium text-gray-700">AI is analyzing your room...</h2>
        <p className="text-gray-500">Evaluating space, lighting, and style.</p>
      </div>
    )
  }

  if (status === 'error') {
    return <div className="text-red-500 text-center py-20">Error analyzing room.</div>
  }

  if (status === 'not_configured') {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">AI Provider Not Configured</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700 space-y-4">
            <p>{errorMessage}</p>
            <p>Please configure the <code>OPENAI_API_KEY</code> in your environment variables to use real AI vision analysis.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'limit_reached') {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Usage Limit Reached</CardTitle>
          </CardHeader>
          <CardContent className="text-red-700 space-y-4">
            <p>{errorMessage}</p>
            <Button variant="default" className="mt-4" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const rawAi = analysisData?.raw_ai_response || {}
  const details = rawAi.details || {}
  
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-200'
      case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'Could Be Improved': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'Needs Attention': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Room Analysis Results</h1>
        <div className="text-3xl font-bold px-6 py-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
          {analysisData?.overall_score}/100
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Category Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(details).map(([key, data]: [string, any]) => (
            <Card key={key} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg capitalize">{key.replace('_', ' ')}</CardTitle>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-md border ${getRatingColor(data.rating)}`}>
                    {data.rating}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-500 mt-1">Score: {data.score}/100</div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow text-sm">
                <p className="text-gray-700">{data.explanation}</p>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-green-700">Strength:</span>
                    <p className="text-gray-600">{data.strength}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-700">Needs Improvement:</span>
                    <p className="text-gray-600">{data.improvement}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6 pt-8">
        <h2 className="text-2xl font-bold border-b pb-2">AI Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map(rec => (
            <Card key={rec.id} className="bg-slate-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg capitalize text-slate-800">{rec.category.replace('_', ' ')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p><strong>Suggestion:</strong> {rec.suggestion}</p>
                <p><strong>Why:</strong> {rec.reasoning}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-8">
        <Button size="lg" onClick={() => router.push(`/dashboard/generate/${id}`)}>Proceed to AI Redesign</Button>
      </div>
    </div>
  )
}
