'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWizardStore } from '@/hooks/useWizardStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

export default function NewProjectWizard() {
  const { step, project, room, file, setStep, setProject, setRoom, setFile } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  const handleSubmit = async () => {
    if (!file) return
    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // 1. Create Project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: project.name,
          home_type: project.homeType,
          budget_band: project.budgetBand,
        })
        .select()
        .single()
      
      if (projectError) throw projectError

      // 2. Upload Image
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath)

      // 3. Create Room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          project_id: projectData.id,
          name: `${room.type} - ${project.name}`,
          type: room.type,
          dimensions: room.dimensions,
          style_preference: room.style,
          color_palette: [room.palette],
        })
        .select()
        .single()

      if (roomError) throw roomError

      // 4. Create Room Image
      const { data: imageData, error: imageError } = await supabase
        .from('room_images')
        .insert({
          room_id: roomData.id,
          image_url: publicUrl,
          type: 'original'
        })
        .select()
        .single()

      if (imageError) throw imageError

      // Redirect to Analysis
      router.push(`/dashboard/analyze/${roomData.id}`)
    } catch (e) {
      console.error(e)
      alert('Error creating project')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Step {step} of 3</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input value={project.name} onChange={e => setProject({ name: e.target.value })} placeholder="E.g., My Dream Home" />
              </div>
              <div>
                <label className="text-sm font-medium">Home Type</label>
                <Select value={project.homeType} onChange={e => setProject({ homeType: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Studio">Studio</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Budget Band</label>
                <Select value={project.budgetBand} onChange={e => setProject({ budgetBand: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Low">Low ($0 - $1k)</option>
                  <option value="Medium">Medium ($1k - $5k)</option>
                  <option value="High">High ($5k+)</option>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Room Type</label>
                <Select value={room.type} onChange={e => setRoom({ type: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Living Room">Living Room</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Bathroom">Bathroom</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Dimensions (e.g. 12x15)</label>
                <Input value={room.dimensions} onChange={e => setRoom({ dimensions: e.target.value })} placeholder="12x15" />
              </div>
              <div>
                <label className="text-sm font-medium">Style Preference</label>
                <Select value={room.style} onChange={e => setRoom({ style: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Modern">Modern</option>
                  <option value="Minimalist">Minimalist</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Bohemian">Bohemian</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Primary Color Palette</label>
                <Input value={room.palette} onChange={e => setRoom({ palette: e.target.value })} placeholder="E.g., Warm Earth Tones" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Upload Room Photo</label>
                <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                {file && <p className="text-sm text-green-600 mt-2">File selected: {file.name}</p>}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || isSubmitting}>Back</Button>
          {step < 3 ? (
            <Button onClick={handleNext} disabled={
              (step === 1 && (!project.name || !project.homeType || !project.budgetBand)) ||
              (step === 2 && (!room.type || !room.dimensions || !room.style || !room.palette))
            }>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!file || isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              Submit
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
