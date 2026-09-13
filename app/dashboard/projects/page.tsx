import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, rooms(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link href="/dashboard/new">
          <Button>Create New Project</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p: any) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href={`/dashboard/projects/${p.id}`}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <div className="text-sm text-gray-500">{p.home_type} • Created {format(new Date(p.created_at), 'MMM dd, yyyy')}</div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm">
                  <span className="bg-gray-100 px-2 py-1 rounded-md">{p.rooms[0].count} Room(s)</span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
        {(!projects || projects.length === 0) && (
          <div className="col-span-full py-12 text-center text-gray-500">
            You haven't created any projects yet.
          </div>
        )}
      </div>
    </div>
  )
}
