'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { BeforeAfter } from '@/components/ui/BeforeAfter'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'

const STYLES = ["Modern", "Minimalist", "Luxury", "Scandinavian", "Traditional", "Contemporary", "Industrial", "Bohemian", "Japandi"]
const PALETTES = ["Warm Neutrals", "Cool Blues", "Earthy Greens", "Monochrome", "Vibrant", "Pastels"]

export default function GenerateDesignPage() {
  const { roomId } = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error' | 'not_configured' | 'limit_reached'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const [intensity, setIntensity] = useState('Moderate redesign')
  const [style, setStyle] = useState('Modern')
  const [palette, setPalette] = useState('Warm Neutrals')
  
  const [result, setResult] = useState<{ designId: string, originalUrl: string, imageUrl: string } | null>(null)

  const handleGenerate = async () => {
    setStatus('generating')
    try {
      const res = await fetch('/api/designs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, intensity, styleOverride: style, paletteOverride: palette })
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
      setResult(data)
      setStatus('done')
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  const handleSave = async () => {
    if (!result) return
    await fetch('/api/designs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId: result.designId })
    })
    router.push('/dashboard/designs')
  }

  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Spinner className="w-8 h-8 text-primary" />
        <h2 className="text-xl font-medium text-gray-700">Generating your new room design...</h2>
        <p className="text-gray-500">Our AI is redesigning your room based on your preferences.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Generate AI Design</h1>
      
      {status === 'idle' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Design Style</label>
              <Select value={style} onChange={e => setStyle(e.target.value)}>
                {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Color Palette</label>
              <Select value={palette} onChange={e => setPalette(e.target.value)}>
                {PALETTES.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Redesign Intensity</label>
              <Select value={intensity} onChange={e => setIntensity(e.target.value)}>
                <option>Light refresh</option>
                <option>Moderate redesign</option>
                <option>Complete redesign</option>
              </Select>
            </div>
            <Button onClick={handleGenerate} className="w-full mt-4" size="lg">Generate Now</Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border flex flex-col items-center justify-center text-center">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">Pro Tips</h3>
            <p className="text-sm text-gray-500">A "Complete redesign" gives the AI more freedom to move structural elements, while a "Light refresh" focuses on colors and minor decor.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-500 text-center py-10 font-medium text-lg">An unexpected error occurred while generating your design.</div>
      )}

      {status === 'not_configured' && (
        <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg text-orange-800">
          <h3 className="text-lg font-semibold mb-2">AI Provider Not Configured</h3>
          <p>{errorMessage}</p>
          <p className="mt-2 text-sm">Please configure the <code>REPLICATE_API_TOKEN</code> in your environment variables to generate redesigns.</p>
          <Button variant="outline" className="mt-6" onClick={() => setStatus('idle')}>Go Back</Button>
        </div>
      )}

      {status === 'limit_reached' && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <h3 className="text-lg font-semibold mb-2">Usage Limit Reached</h3>
          <p>{errorMessage}</p>
          <Button variant="outline" className="mt-6" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <BeforeAfter beforeImage={result.originalUrl} afterImage={result.imageUrl} />
          
          <div className="flex gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg border">
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">Style:</span> {style} • 
              <span className="font-semibold text-gray-700 ml-2">Palette:</span> {palette} • 
              <span className="font-semibold text-gray-700 ml-2">Intensity:</span> {intensity}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStatus('idle')}>Try Another Variation</Button>
              <Button onClick={handleSave}>Save & View Details</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
