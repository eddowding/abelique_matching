'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const LOOKING_FOR_OPTIONS = [
  'Co-founders',
  'Mentors',
  'Mentees',
  'Collaborators',
  'Investors',
  'Advisors',
  'Friends',
  'Job opportunities',
  'Hiring talent',
  'Learning partners',
]

const OFFERING_OPTIONS = [
  'Technical skills',
  'Design skills',
  'Business expertise',
  'Industry connections',
  'Mentorship',
  'Funding',
  'Marketing help',
  'Product feedback',
  'Career advice',
  'Friendship',
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    current_work: '',
    looking_for: [] as string[],
    offering: [] as string[],
    linkedin_url: '',
  })

  const toggleOption = (field: 'looking_for' | 'offering', option: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter(o => o !== option)
        : [...prev[field], option],
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create profile')
      }

      router.push('/discover')
    } catch (error) {
      console.error('Error creating profile:', error)
      alert('Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full mx-1 ${i <= step ? 'bg-primary' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Let&apos;s get to know you</CardTitle>
              <CardDescription>What should people call you?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Your full name"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              />
              <Textarea
                placeholder="Tell us about yourself in a few sentences..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.full_name.trim()}
                className="w-full"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>What are you working on?</CardTitle>
              <CardDescription>Share what keeps you busy these days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="E.g., Building a climate tech startup, Learning to code, Managing a product team at a fintech company..."
                value={formData.current_work}
                onChange={e => setFormData({ ...formData, current_work: e.target.value })}
                rows={4}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>What are you looking for?</CardTitle>
              <CardDescription>Select all that apply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={formData.looking_for.includes(option) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-2 px-3"
                    onClick={() => toggleOption('looking_for', option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1">Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>What can you offer?</CardTitle>
              <CardDescription>Help others find you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {OFFERING_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={formData.offering.includes(option) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-2 px-3"
                    onClick={() => toggleOption('offering', option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>

              <div className="pt-4">
                <label className="text-sm text-muted-foreground">LinkedIn (optional)</label>
                <Input
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedin_url}
                  onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? 'Creating profile...' : 'Find my matches'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
