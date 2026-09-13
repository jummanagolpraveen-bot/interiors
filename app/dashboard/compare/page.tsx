'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

import { Suspense } from 'react'

function CompareContent() {
  const searchParams = useSearchParams()
  const ids = searchParams.get('ids')?.split(',') || []
  
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDesigns = async () => {
      if (ids.length === 0) {
        setLoading(false)
        return
      }
      
      const { data } = await supabase
        .from('design_generations')
        .select('*, room:rooms(*, analyses(*))')
        .in('id', ids)
      
      setDesigns(data || [])
      setLoading(false)
    }
    fetchDesigns()
  }, [ids])

  if (loading) return <div className="py-20 flex justify-center"><Spinner className="w-8 h-8" /></div>

  if (designs.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl">No designs selected for comparison.</h2>
        <Link href="/dashboard/designs"><Button>Go to History</Button></Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compare Designs</h1>
        <Link href="/dashboard/designs">
          <Button variant="outline">Back to History</Button>
        </Link>
      </div>

      <div className="grid gap-6 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${designs.length}, minmax(300px, 1fr))` }}>
        {designs.map(d => {
          const analysis = d.room?.analyses?.[0]
          return (
            <Card key={d.id} className="flex flex-col">
              <div className="aspect-video w-full">
                <img src={d.generated_image_url} alt="Design" className="w-full h-full object-cover rounded-t-lg" />
              </div>
              <CardHeader>
                <CardTitle className="capitalize">{d.room?.room_type}</CardTitle>
                <div className="text-sm text-gray-500 line-clamp-2" title={d.prompt_used}>{d.prompt_used}</div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <div>
                  <span className="text-xs font-semibold uppercase text-gray-500">Original AI Score</span>
                  <div className="text-xl font-bold text-primary">{analysis?.overall_score || 'N/A'}/100</div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-gray-500">Dimensions</span>
                  <div>{d.room?.length}x{d.room?.width} ft</div>
                </div>
                <div className="pt-4 border-t mt-4 flex flex-col gap-2">
                  <Button variant="outline" className="w-full">Set as Favorite</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><Spinner className="w-8 h-8" /></div>}>
      <CompareContent />
    </Suspense>
  )
}
