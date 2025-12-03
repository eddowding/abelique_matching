'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/database'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface MatchRequest {
  id: string
  created_at: string
  requester: Profile
}

export default function RequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<MatchRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/match-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requesterId: string) => {
    setActionLoading(requesterId)
    try {
      // Create a reverse match request (which will trigger mutual match)
      const response = await fetch('/api/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: requesterId }),
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.requester.id !== requesterId))
        alert("It's a match! Check your Connections page.")
      }
    } catch (error) {
      console.error('Error accepting:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (requesterId: string) => {
    setActionLoading(requesterId)
    try {
      // Hide this person
      await fetch('/api/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden_id: requesterId }),
      })
      setRequests(prev => prev.filter(r => r.requester.id !== requesterId))
    } catch (error) {
      console.error('Error declining:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading requests...</p>
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
              className="rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/discover')}
            >
              Discover
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-primary text-primary"
            >
              Requests {requests.length > 0 && <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>}
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
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No pending requests.
            </p>
            <p className="text-sm text-muted-foreground">
              When someone wants to connect with you, you&apos;ll see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {requests.length} people want to connect with you
            </p>
            {requests.map(req => (
              <Card key={req.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                        {getInitials(req.requester.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{req.requester.full_name}</h3>
                      {req.requester.current_work && (
                        <p className="text-sm text-muted-foreground">
                          {req.requester.current_work}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {req.requester.bio && (
                    <p className="text-sm text-gray-700">{req.requester.bio}</p>
                  )}

                  {req.requester.looking_for && req.requester.looking_for.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Looking for</p>
                      <div className="flex flex-wrap gap-1">
                        {req.requester.looking_for.slice(0, 4).map(item => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Requested {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDecline(req.requester.id)}
                    disabled={actionLoading === req.requester.id}
                  >
                    Decline
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleAccept(req.requester.id)}
                    disabled={actionLoading === req.requester.id}
                  >
                    Accept
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
