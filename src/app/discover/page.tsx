'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ProfileRow } from '@/components/profile-row'
import { AppShell } from '@/components/app-shell'
import { Profile } from '@/types/database'

type MatchProfile = Profile & { similarity?: number; match_reason?: string | null }

const PAGE_SIZE = 20

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<MatchProfile[]>([])
  const [currentUser, setCurrentUser] = useState<{ looking_for?: string[] | null; offering?: string[] | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [connectionCount, setConnectionCount] = useState(0)
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

  const fetchCounts = async () => {
    try {
      const [reqRes, connRes] = await Promise.all([
        fetch('/api/match-requests'),
        fetch('/api/connections')
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

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser({
          looking_for: data.looking_for,
          offering: data.offering
        })
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  useEffect(() => {
    fetchProfiles(0)
    fetchCounts()
    fetchCurrentUser()
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
          setConnectionCount(prev => prev + 1)
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
      <AppShell requestCount={requestCount} connectionCount={connectionCount}>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Finding your matches...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell requestCount={requestCount} connectionCount={connectionCount}>
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
              currentUser={currentUser || undefined}
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
    </AppShell>
  )
}
