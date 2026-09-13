import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { redirect } from 'next/navigation'
import { UsageChart } from '@/components/ui/UsageChart'
import { format, subDays } from 'date-fns'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get stats scoped via RLS implicitly
  const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })
  const { count: analysesCount } = await supabase.from('analyses').select('*', { count: 'exact', head: true })
  const { count: designsCount } = await supabase.from('design_generations').select('*', { count: 'exact', head: true })
  const { count: savedCount } = await supabase.from('saved_designs').select('*', { count: 'exact', head: true })

  // Get recent projects
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get usage logs for chart (last 7 days)
  const { data: usageLogs } = await supabase
    .from('usage_logs')
    .select('action_type, created_at')
    .gte('created_at', subDays(new Date(), 7).toISOString())

  const chartDataMap: Record<string, { date: string, analyses: number, generations: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM dd')
    chartDataMap[d] = { date: d, analyses: 0, generations: 0 }
  }

  if (usageLogs) {
    usageLogs.forEach(log => {
      const d = format(new Date(log.created_at), 'MMM dd')
      if (chartDataMap[d]) {
        if (log.action_type === 'analysis') chartDataMap[d].analyses++
        if (log.action_type === 'generation') chartDataMap[d].generations++
      }
    })
  }

  const chartData = Object.values(chartDataMap)

  return (
    <div className="w-full space-y-8">
      <h1 className="text-3xl font-bold">Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Designs Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designsCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Designs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>AI Usage (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <UsageChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Link href="/dashboard/projects" className="text-sm text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects && recentProjects.length > 0 ? (
                recentProjects.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.home_type}</p>
                    </div>
                    <Link href={`/dashboard/projects/${p.id}`} className="text-sm font-medium text-primary hover:underline">
                      Open
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No projects yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
