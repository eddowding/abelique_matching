'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileRow } from '@/components/profile-row'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/button'

type MatchProfile = Profile & { similarity?: number; match_reason?: string | null }

const PAGE_SIZE = 20

export default function DiscoverPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<MatchProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchProfiles = useCallback(async (currentOffset: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/matches?all=true&limit=${PAGE_SIZE}&offset=${currentOffset}`)
      if (response.ok) {
        const data = await response.json()
        if (append) {
          setProfiles(prev => [...prev, ...data])
        } else {
          setProfiles(data)
        }
        setHasMore(data.length === PAGE_SIZE)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const fetchRequestCount = async () => {
    try {
      const response = await fetch('/api/match-requests')
      if (response.ok) {
        const data = await response.json()
        setRequestCount(data.length)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  useEffect(() => {
    fetchProfiles(0)
    fetchRequestCount()
  }, [fetchProfiles])

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

  const handleConnect = async (targetId: string) => {
    setActionLoading(targetId)
    try {
      const response = await fetch('/api/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfiles(prev => prev.filter(m => m.id !== targetId))

        if (data.is_mutual) {
          alert("It's a match! You can now see their contact info in Connections.")
        }
      }
    } catch (error) {
      console.error('Error connecting:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleHide = async (targetId: string) => {
    setActionLoading(targetId)
    try {
      const response = await fetch('/api/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden_id: targetId }),
      })

      if (response.ok) {
        setProfiles(prev => prev.filter(m => m.id !== targetId))
      }
    } catch (error) {
      console.error('Error hiding:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profiles...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Match</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/profile')}
            >
              Profile
            </Button>
          </div>
          <nav className="flex gap-1 mt-3 -mb-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-primary text-primary"
            >
              Discover
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/requests')}
            >
              Requests {requestCount > 0 && <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">{requestCount}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/connections')}
            >
              Connections
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No profiles to show right now.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later as more people join!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {profiles.length} people{hasMore ? '+' : ''} sorted by compatibility
            </p>
            {profiles.map(profile => (
              <ProfileRow
                key={profile.id}
                profile={profile}
                onConnect={handleConnect}
                onHide={handleHide}
                loading={actionLoading === profile.id}
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
      </main>
    </div>
  )
}
