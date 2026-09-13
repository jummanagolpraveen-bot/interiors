import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BeforeAfter } from '@/components/ui/BeforeAfter'
import { notFound } from 'next/navigation'

export default async function SharedDesignPage({ params }: { params: { shareId: string } }) {
  // Try to use a service role client to bypass RLS, or fallback to anon client which will fail without a policy update
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: shared } = await supabase
    .from('shared_designs')
    .select('design_generation_id')
    .eq('share_token', params.shareId)
    .single()

  if (!shared) return notFound()

  const { data: design } = await supabase
    .from('design_generations')
    .select('*, room:rooms(*, analyses(*, recommendations(*)))')
    .eq('id', shared.design_generation_id)
    .single()

  if (!design) return notFound()

  const originalImage = design.original_image_url
  const generatedImage = design.generated_image_url
  const analysis = design.room?.analyses?.[0]
  const recs = analysis?.recommendations || []

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-primary">InteriaAI</div>
          <div className="text-sm text-gray-500">Shared Design Concept</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold capitalize">{design.room?.room_type} Redesign</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            This space was reimagined using AI, featuring a {design.style || design.room?.preferred_style} style and custom color palette.
          </p>
        </div>

        <Card className="overflow-hidden border-0 shadow-lg">
          <BeforeAfter beforeImage={originalImage} afterImage={generatedImage} />
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Dimensions</span>
                <p className="font-medium">{design.room?.length} x {design.room?.width} ft</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Style Profile</span>
                <p className="font-medium capitalize">{design.room?.preferred_style}</p>
              </div>
              {analysis && (
                <div>
                  <span className="text-sm text-gray-500">Original AI Score</span>
                  <div className="text-2xl font-bold text-primary">{analysis.overall_score}/100</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {recs.length > 0 ? (
                <div className="space-y-4">
                  {recs.slice(0, 4).map((rec: any) => (
                    <div key={rec.id} className="pb-4 border-b last:border-0 last:pb-0">
                      <h4 className="font-semibold capitalize">{rec.category.replace('_', ' ')}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recommendations available for this design.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
