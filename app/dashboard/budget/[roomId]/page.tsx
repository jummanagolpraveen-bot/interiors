'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Select'

export default function BudgetPlannerPage() {
  const { roomId } = useParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [estimate, setEstimate] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [qualityLevel, setQualityLevel] = useState('Standard')

  const fetchBudget = async () => {
    setLoading(true)
    const { data: est } = await supabase
      .from('budget_estimates')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (est) {
      setEstimate(est)
      const { data: estItems } = await supabase.from('budget_items').select('*').eq('estimate_id', est.id)
      setItems(estItems || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBudget()
  }, [roomId])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/budget/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, qualityLevel })
      })
      if (!res.ok) throw new Error('Failed to generate budget')
      await fetchBudget()
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div className="py-20 flex justify-center"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budget Planner</h1>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>

      {!estimate ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate a Custom Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Our AI can estimate the costs for your room renovation based on its dimensions, style, and your preferred quality level.</p>
            <div className="max-w-xs space-y-2">
              <label className="text-sm font-medium">Quality Level</label>
              <Select value={qualityLevel} onChange={e => setQualityLevel(e.target.value)}>
                <option>Budget</option>
                <option>Standard</option>
                <option>Premium</option>
                <option>Luxury</option>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Spinner className="w-4 h-4 mr-2" /> : null}
              {generating ? 'Generating...' : 'Generate Estimate'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 uppercase font-semibold">Total Estimated Cost</p>
              <h2 className="text-3xl font-bold text-primary">${estimate.total_estimated_min} - ${estimate.total_estimated_max}</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm bg-gray-100 px-3 py-1 rounded-full border">{estimate.quality_level} Quality</span>
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold text-right">Min Cost</th>
                  <th className="p-4 font-semibold text-right">Max Cost</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-medium capitalize">{item.category.replace('_', ' ')}</td>
                    <td className="p-4 text-right">${item.min_amount}</td>
                    <td className="p-4 text-right">${item.max_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center">* All amounts are estimates and may vary based on location and contractors.</p>
        </div>
      )}
    </div>
  )
}
