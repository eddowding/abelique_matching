'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Profile } from '@/types/database'

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

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    current_work: '',
    looking_for: [] as string[],
    offering: [] as string[],
    linkedin_url: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const profile: Profile = await response.json()
        setFormData({
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          current_work: profile.current_work || '',
          looking_for: profile.looking_for || [],
          offering: profile.offering || [],
          linkedin_url: profile.linkedin_url || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOption = (field: 'looking_for' | 'offering', option: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(option)
        ? prev[field].filter(o => o !== option)
        : [...prev[field], option],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated! Your matches will be recalculated.' })
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Edit Profile</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/discover')}
          >
            Back to Discover
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
              <CardDescription>How you appear to others</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-1"
                  rows={4}
                  placeholder="Tell others about yourself..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">What are you working on?</label>
                <Textarea
                  value={formData.current_work}
                  onChange={e => setFormData({ ...formData, current_work: e.target.value })}
                  className="mt-1"
                  rows={3}
                  placeholder="Your current projects, role, or focus..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">LinkedIn URL</label>
                <Input
                  value={formData.linkedin_url}
                  onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="mt-1"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What are you looking for?</CardTitle>
              <CardDescription>Select all that apply</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What can you offer?</CardTitle>
              <CardDescription>Help others find you</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {message && (
            <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
