import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*, rooms(*, room_images(*), analyses(*), design_generations(*))')
    .eq('id', params.id)
    .single()

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.home_type} • Created {format(new Date(project.created_at), 'MMM dd, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          {/* We will implement edit/delete via forms later, simplified for now */}
          <Button variant="outline">Edit Project</Button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Rooms in this Project</h2>
        
        {project.rooms?.map((room: any) => {
          const originalImage = room.room_images.find((img: any) => img.type === 'original')
          return (
            <Card key={room.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {originalImage && (
                  <div className="md:w-1/3 bg-gray-100">
                    <img src={originalImage.image_url} alt="Room" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 md:w-2/3 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold capitalize">{room.room_type}</h3>
                      <p className="text-sm text-gray-500">{room.preferred_style} Style • {room.length}x{room.width}ft</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{room.analyses.length}</div>
                      <div className="text-xs text-gray-500">Analyses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{room.design_generations.length}</div>
                      <div className="text-xs text-gray-500">Designs</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {room.analyses.length > 0 ? (
                      <Link href={`/dashboard/analyze/${room.id}`}>
                        <Button variant="outline">View Analysis</Button>
                      </Link>
                    ) : (
                      <Link href={`/dashboard/analyze/${room.id}`}>
                        <Button variant="outline">Analyze Room</Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/generate/${room.id}`}>
                      <Button>Generate Design</Button>
                    </Link>
                    <Link href={`/dashboard/budget/${room.id}`}>
                      <Button variant="outline">Budget Planner</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
