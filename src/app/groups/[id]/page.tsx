'use client'

import { useEffect, useState, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, User, Share2, Copy, Sparkles, Info, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileRow } from '@/components/profile-row'
import { Group, GroupProfileData } from '@/types/database'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

interface GroupWithMeta extends Group {
  role: string
  member_count: number
}

type MatchProfile = {
  user_id: string
  full_name: string
  email: string
  linkedin_url: string | null
  profile_data: GroupProfileData
  similarity?: number
  match_reason?: string
}

type CurrentUser = {
  looking_for: string[]
  offering: string[]
}

const PAGE_SIZE = 20

export default function GroupDiscoverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithMeta | null>(null)
  const [profiles, setProfiles] = useState<MatchProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [connectionCount, setConnectionCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasProfile, setHasProfile] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data)
      }
    } catch (error) {
      console.error('Error fetching group:', error)
    }
  }

  const checkProfile = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/profile`)
      if (response.ok) {
        const data = await response.json()
        if (!data.profile_data || !data.profile_data.bio) {
          setHasProfile(false)
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    }
  }

  const fetchProfiles = useCallback(async (currentOffset: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/matches?limit=${PAGE_SIZE}&offset=${currentOffset}`)
      if (response.ok) {
        const data = await response.json()
        const matches = data.matches || []
        if (append) {
          setProfiles(prev => [...prev, ...matches])
        } else {
          setProfiles(matches)
          // Only set current user on first fetch
          if (data.current_user) {
            setCurrentUser(data.current_user)
          }
        }
        setHasMore(data.has_more ?? matches.length === PAGE_SIZE)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [groupId])

  const fetchCounts = async () => {
    try {
      const [reqRes, connRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/match-requests`),
        fetch(`/api/groups/${groupId}/connections`)
      ])
      if (reqRes.ok) {
        const data = await reqRes.json()
        setRequestCount(data.length)
      }
      if (connRes.ok) {
        const data = await connRes.json()
        setConnectionCount(data.length)
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  useEffect(() => {
    fetchGroup()
    checkProfile()
    fetchProfiles(0)
    fetchCounts()
  }, [groupId, fetchProfiles])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const newOffset = offset + PAGE_SIZE
          setOffset(newOffset)
          fetchProfiles(newOffset, true)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, offset, fetchProfiles])

  const celebrateMutualMatch = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const handleConnect = async (targetId: string) => {
    setActionLoading(targetId)
    try {
      const response = await fetch(`/api/groups/${groupId}/match-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfiles(prev => prev.filter(m => m.user_id !== targetId))

        if (data.is_mutual) {
          setConnectionCount(prev => prev + 1)
          celebrateMutualMatch()
          toast.success("It's a match! 🎉", {
            description: "You can now see their contact info in Connections.",
          })
        } else {
          toast.success("Request sent!", {
            description: "They'll see your request and can connect back.",
          })
        }
      }
    } catch (error) {
      console.error('Error connecting:', error)
      toast.error("Something went wrong", {
        description: "Please try again.",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleHide = async (targetId: string) => {
    setActionLoading(targetId)
    try {
      const response = await fetch(`/api/groups/${groupId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden_id: targetId }),
      })

      if (response.ok) {
        setProfiles(prev => prev.filter(m => m.user_id !== targetId))
      }
    } catch (error) {
      console.error('Error hiding:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const copyInviteLink = async () => {
    if (!group?.invite_code) return
    const inviteUrl = `${window.location.origin}/join/${group.invite_code}`
    await navigator.clipboard.writeText(inviteUrl)
    toast.success("Invite link copied!", {
      description: "Share it with people you'd like to join.",
    })
  }

  // Convert group profile to display format
  const convertToDisplayProfile = (profile: MatchProfile) => ({
    id: profile.user_id,
    full_name: profile.full_name,
    email: profile.email,
    linkedin_url: profile.linkedin_url,
    bio: profile.profile_data?.bio || null,
    current_work: profile.profile_data?.current_work || null,
    looking_for: profile.profile_data?.looking_for || null,
    offering: profile.profile_data?.offering || null,
    similarity: profile.similarity,
    match_reason: profile.match_reason || null,
    // Required by Profile type but not used in display
    created_at: null,
    embedding: null,
    updated_at: null,
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary animate-pulse" />
              <p className="text-muted-foreground">Finding your matches...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/groups')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Groups
          </Button>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to {group?.name}!</h1>
            <p className="text-muted-foreground mb-6">
              Complete your profile to start discovering great matches.
            </p>
            <Button onClick={() => router.push(`/groups/${groupId}/profile`)} size="lg">
              Set Up Your Profile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/groups')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{group?.name}</h1>
              <p className="text-sm text-muted-foreground">
                {group?.member_count} member{group?.member_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/groups/${groupId}/info`)}
              title="Group Info & Invite Link"
            >
              <Info className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/account')}
              title="Account Settings"
            >
              <UserCircle className="w-5 h-5" />
            </Button>
            {group?.role === 'admin' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/groups/${groupId}/settings`)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Button variant="default" size="sm">
            Discover
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}/requests`)}
          >
            Requests {requestCount > 0 && `(${requestCount})`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}/connections`)}
          >
            Connections {connectionCount > 0 && `(${connectionCount})`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}/profile`)}
          >
            Profile
          </Button>
        </div>

        {/* Profiles */}
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">You're the first one here!</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Invite others to join and start making meaningful connections.
            </p>
            <Button onClick={copyInviteLink} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy Invite Link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {profiles.length} people{hasMore ? '+' : ''} sorted by compatibility
            </p>
            {profiles.map(profile => (
              <ProfileRow
                key={profile.user_id}
                profile={convertToDisplayProfile(profile)}
                currentUser={currentUser || undefined}
                onConnect={handleConnect}
                onHide={handleHide}
                loading={actionLoading === profile.user_id}
                groupId={groupId}
              />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <p className="text-sm text-muted-foreground">Loading more...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
