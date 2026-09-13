'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function FavoritesPage() {
  const supabase = createClient()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('saved_designs')
      .select('*, design:design_generations(*, room:rooms(room_type))')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false })
    
    setFavorites(data || [])
    setLoading(false)
  }

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    await supabase.from('saved_designs').update({ is_favorite: !currentStatus }).eq('id', id)
    fetchFavorites()
  }

  const handleShare = async (designId: string) => {
    const res = await fetch('/api/designs/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designId })
    })
    const data = await res.json()
    if (data.shareToken) {
      window.open(`/design/share/${data.shareToken}`, '_blank')
    }
  }

  if (loading) return <div className="py-20 text-center">Loading favorites...</div>

  return (
    <div className="w-full space-y-8">
      <h1 className="text-3xl font-bold">Favorite Designs</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map(f => (
          <Card key={f.id} className="overflow-hidden">
            <div className="aspect-video relative group">
              <img src={f.design?.generated_image_url} alt="Design" className="w-full h-full object-cover" />
              <button 
                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white text-red-500"
                onClick={() => toggleFavorite(f.id, f.is_favorite)}
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-bold capitalize">{f.design?.room?.room_type}</h3>
              <p className="text-sm text-gray-500 truncate">{f.design?.prompt_used}</p>
              <div className="flex justify-between items-center mt-4">
                <div className="text-xs text-gray-400">{format(new Date(f.created_at), 'MMM dd, yyyy')}</div>
                <Button size="sm" variant="outline" onClick={() => handleShare(f.design?.id)}>Share</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {favorites.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            You haven't added any designs to your favorites yet.
          </div>
        )}
      </div>
    </div>
  )
}
