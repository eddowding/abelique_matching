'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Group, GroupProfileData } from '@/types/database'

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

interface GroupWithMeta extends Group {
  role: string
  member_count: number
}

interface ProfileFormData extends GroupProfileData {
  full_name: string
}

export default function GroupProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    bio: '',
    current_work: '',
    looking_for: [],
    offering: [],
    linkedin_url: '',
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [groupRes, profileRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/groups/${groupId}/profile`)
        ])

        if (groupRes.ok) {
          const groupData = await groupRes.json()
          setGroup(groupData)
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json()
          setFormData({
            full_name: profileData.full_name || '',
            bio: profileData.profile_data?.bio || '',
            current_work: profileData.profile_data?.current_work || '',
            looking_for: profileData.profile_data?.looking_for || [],
            offering: profileData.profile_data?.offering || [],
            linkedin_url: profileData.profile_data?.linkedin_url || '',
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [groupId])

  const toggleOption = (field: 'looking_for' | 'offering', option: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.includes(option)
        ? prev[field]?.filter(o => o !== option)
        : [...(prev[field] || []), option],
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      // Update group profile
      const response = await fetch(`/api/groups/${groupId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: formData.bio,
          current_work: formData.current_work,
          looking_for: formData.looking_for,
          offering: formData.offering,
          linkedin_url: formData.linkedin_url,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Update name in main profile
      if (formData.full_name) {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: formData.full_name }),
        })
      }

      toast.success('Profile saved!', {
        description: 'Your changes are now visible to others.',
      })
      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to save profile', {
        description: 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}`)}
          >
            Back to Discover
          </Button>
        </div>

        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Info</CardTitle>
              <CardDescription>How you appear to others</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Your name"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_work">What are you working on?</Label>
                <Textarea
                  id="current_work"
                  placeholder="E.g., Building a climate tech startup, Learning to code..."
                  value={formData.current_work}
                  onChange={e => setFormData({ ...formData, current_work: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedin_url}
                  onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Looking For Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What are you looking for?</CardTitle>
              <CardDescription>Select all that apply</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={formData.looking_for?.includes(option) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggleOption('looking_for', option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Offering Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What can you offer?</CardTitle>
              <CardDescription>Help others find you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {OFFERING_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={formData.offering?.includes(option) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggleOption('offering', option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button onClick={handleSubmit} disabled={saving} className="w-full" size="lg">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
