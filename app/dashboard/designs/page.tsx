'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export default function DesignsPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [styleFilter, setStyleFilter] = useState('All')
  
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])

  useEffect(() => {
    const fetchDesigns = async () => {
      const { data } = await supabase
        .from('design_generations')
        .select('*, room:rooms(room_type, preferred_style)')
        .order('created_at', { ascending: false })
      setDesigns(data || [])
      setLoading(false)
    }
    fetchDesigns()
  }, [])

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(prev => prev.filter(x => x !== id))
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can only compare up to 3 designs.')
        return
      }
      setSelectedForCompare(prev => [...prev, id])
    }
  }

  const handleCompare = () => {
    if (selectedForCompare.length < 2) {
      alert('Select at least 2 designs to compare.')
      return
    }
    router.push(`/dashboard/compare?ids=${selectedForCompare.join(',')}`)
  }

  const filteredDesigns = designs.filter(d => {
    if (search && !d.room?.room_type.toLowerCase().includes(search.toLowerCase())) return false
    if (styleFilter !== 'All' && !d.prompt_used?.includes(styleFilter)) return false
    return true
  })

  if (loading) return <div className="py-20 text-center">Loading designs...</div>

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Design History</h1>
        {selectedForCompare.length > 0 && (
          <Button onClick={handleCompare}>
            Compare Selected ({selectedForCompare.length}/3)
          </Button>
        )}
      </div>

      <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <Input 
          placeholder="Search by room type..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs bg-white"
        />
        <Select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} className="w-[180px] bg-white">
          <option value="All">All Styles</option>
          <option value="Modern">Modern</option>
          <option value="Minimalist">Minimalist</option>
          <option value="Luxury">Luxury</option>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDesigns.map(d => (
          <Card key={d.id} className={`overflow-hidden transition-all ${selectedForCompare.includes(d.id) ? 'ring-2 ring-primary' : ''}`}>
            <div className="aspect-video relative group">
              <img src={d.generated_image_url} alt="Design" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant={selectedForCompare.includes(d.id) ? 'default' : 'secondary'}
                  onClick={() => toggleCompare(d.id)}
                >
                  {selectedForCompare.includes(d.id) ? 'Selected' : 'Compare'}
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold capitalize">{d.room?.room_type}</h3>
              <p className="text-sm text-gray-500 truncate" title={d.prompt_used}>{d.prompt_used}</p>
              <div className="text-xs text-gray-400 mt-2">{format(new Date(d.created_at), 'MMM dd, yyyy')}</div>
            </CardContent>
          </Card>
        ))}
        {filteredDesigns.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">No designs found.</div>
        )}
      </div>
    </div>
  )
}
