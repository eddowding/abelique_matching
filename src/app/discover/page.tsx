'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchCard } from '@/components/match-card'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type MatchProfile = Profile & { similarity?: number; match_reason?: string | null }

export default function DiscoverPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<MatchProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    fetchMatches()
    fetchRequestCount()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matches?reasons=true')
      if (response.ok) {
        const data = await response.json()
        setMatches(data)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

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
        // Remove from list
        setMatches(prev => prev.filter(m => m.id !== targetId))

        if (data.is_mutual) {
          // Show celebration or redirect to connections
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
        setMatches(prev => prev.filter(m => m.id !== targetId))
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
        <p className="text-muted-foreground">Finding your matches...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Discover</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/requests')}
            >
              Requests {requestCount > 0 && `(${requestCount})`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/connections')}
            >
              Connections
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/profile')}
            >
              Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No more matches to show right now.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back later as more people join!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {matches.length} potential matches
            </p>
            <Separator />
            {matches.map(match => (
              <MatchCard
                key={match.id}
                profile={match}
                onConnect={handleConnect}
                onHide={handleHide}
                loading={actionLoading === match.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
