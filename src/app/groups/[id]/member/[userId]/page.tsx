'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Linkedin, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupProfileData } from '@/types/database'
import { toast } from 'sonner'

interface MemberProfile {
  user_id: string
  full_name: string
  email: string
  linkedin_url: string | null
  profile_data: GroupProfileData
  similarity?: number
  match_reason?: string
}

export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>
}) {
  const { id: groupId, userId } = use(params)
  const router = useRouter()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<{ looking_for?: string[]; offering?: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        // Fetch matches to get this user's profile and similarity
        const response = await fetch(`/api/groups/${groupId}/matches?limit=100`)
        if (response.ok) {
          const data = await response.json()
          const match = data.matches?.find((m: MemberProfile) => m.user_id === userId)
          if (match) {
            setProfile(match)
          }
          if (data.current_user) {
            setCurrentUser(data.current_user)
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [groupId, userId])

  const handleConnect = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/match-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: userId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.is_mutual) {
          toast.success("It's a match!", {
            description: "You can now see their contact info in Connections.",
          })
        } else {
          toast.success("Request sent!", {
            description: "They'll see your request and can connect back.",
          })
        }
        router.push(`/groups/${groupId}`)
      }
    } catch (error) {
      console.error('Error connecting:', error)
      toast.error("Something went wrong")
    } finally {
      setActionLoading(false)
    }
  }

  const handleHide = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden_id: userId }),
      })

      if (response.ok) {
        toast.success("Profile hidden")
        router.push(`/groups/${groupId}`)
      }
    } catch (error) {
      console.error('Error hiding:', error)
    } finally {
      setActionLoading(false)
    }
  }

  // Check for matching tags
  const lookingForMatches = new Set(
    (profile?.profile_data?.looking_for || []).filter(item => {
      const itemLower = item.toLowerCase()
      const matchesOffering = (currentUser?.offering || []).some(offer =>
        offer.toLowerCase().includes(itemLower) || itemLower.includes(offer.toLowerCase())
      )
      const matchesLookingFor = (currentUser?.looking_for || []).some(want =>
        want.toLowerCase().includes(itemLower) || itemLower.includes(want.toLowerCase())
      )
      return matchesOffering || matchesLookingFor
    })
  )

  const offeringMatches = new Set(
    (profile?.profile_data?.offering || []).filter(item => {
      const itemLower = item.toLowerCase()
      const matchesLookingFor = (currentUser?.looking_for || []).some(want =>
        want.toLowerCase().includes(itemLower) || itemLower.includes(want.toLowerCase())
      )
      const matchesOffering = (currentUser?.offering || []).some(offer =>
        offer.toLowerCase().includes(itemLower) || itemLower.includes(offer.toLowerCase())
      )
      return matchesLookingFor || matchesOffering
    })
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Button onClick={() => router.push(`/groups/${groupId}`)}>
            Back to Group
          </Button>
        </div>
      </div>
    )
  }

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const similarityPercent = profile.similarity
    ? Math.round(profile.similarity * 100)
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/groups/${groupId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discover
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  {similarityPercent && similarityPercent > 0 && (
                    <Badge variant="secondary">{similarityPercent}% match</Badge>
                  )}
                </div>
                {profile.profile_data?.current_work && (
                  <p className="text-muted-foreground mt-1">
                    {profile.profile_data.current_work}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Reason */}
        {profile.match_reason && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Why you might connect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{profile.match_reason}</p>
            </CardContent>
          </Card>
        )}

        {/* Bio */}
        {profile.profile_data?.bio && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.profile_data.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Looking For */}
        {profile.profile_data?.looking_for && profile.profile_data.looking_for.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Looking for</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.profile_data.looking_for.map(item => (
                  <Badge
                    key={item}
                    variant="outline"
                    className={
                      lookingForMatches.has(item)
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : ''
                    }
                  >
                    {item}
                    {lookingForMatches.has(item) && ' ✓'}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offering */}
        {profile.profile_data?.offering && profile.profile_data.offering.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Can offer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.profile_data.offering.map(item => (
                  <Badge
                    key={item}
                    variant="outline"
                    className={
                      offeringMatches.has(item)
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : ''
                    }
                  >
                    {item}
                    {offeringMatches.has(item) && ' ✓'}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact */}
        {profile.linkedin_url && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Links</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Linkedin className="w-5 h-5" />
                LinkedIn Profile
              </a>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleHide}
            disabled={actionLoading}
            className="flex-1"
          >
            Not Now
          </Button>
          <Button
            onClick={handleConnect}
            disabled={actionLoading}
            className="flex-1"
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  )
}
