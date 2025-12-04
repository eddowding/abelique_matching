'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Group, GroupProfileData } from '@/types/database'

interface GroupWithMeta extends Group {
  role: string
  member_count: number
}

interface MatchRequest {
  id: string
  created_at: string
  requester: {
    id: string
    full_name: string
    email: string
    profile_data: GroupProfileData
  }
}

export default function GroupRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithMeta | null>(null)
  const [requests, setRequests] = useState<MatchRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)

  useEffect(() => {
    fetchGroup()
    fetchRequests()
    fetchConnectionCount()
  }, [groupId])

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

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/match-requests`)
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

  const fetchConnectionCount = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/connections`)
      if (response.ok) {
        const data = await response.json()
        setConnectionCount(data.length)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  }

  const handleAccept = async (requestId: string, requesterId: string) => {
    setActionLoading(requesterId)
    try {
      const response = await fetch(`/api/groups/${groupId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId }),
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
        setConnectionCount(prev => prev + 1)
        alert("It's a match! Check your Connections page.")
      }
    } catch (error) {
      console.error('Error accepting:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (requesterId: string, requestId: string) => {
    setActionLoading(requesterId)
    try {
      await fetch(`/api/groups/${groupId}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden_id: requesterId }),
      })
      setRequests(prev => prev.filter(r => r.id !== requestId))
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-muted-foreground text-center py-20">Loading requests...</p>
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

        {/* Navigation */}
        <div className="flex gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}`)}
          >
            Discover
          </Button>
          <Button variant="default" size="sm">
            Requests {requests.length > 0 && `(${requests.length})`}
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

        {/* Requests */}
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
              <Card key={req.id} className="shadow-sm border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                        {getInitials(req.requester.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{req.requester.full_name}</h3>
                      {req.requester.profile_data?.current_work && (
                        <p className="text-sm text-muted-foreground">
                          {req.requester.profile_data.current_work}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {req.requester.profile_data?.bio && (
                    <p className="text-sm text-gray-700">{req.requester.profile_data.bio}</p>
                  )}

                  {req.requester.profile_data?.looking_for && req.requester.profile_data.looking_for.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Looking for</p>
                      <div className="flex flex-wrap gap-1">
                        {req.requester.profile_data.looking_for.slice(0, 4).map(item => (
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
                    onClick={() => handleDecline(req.requester.id, req.id)}
                    disabled={actionLoading === req.requester.id}
                  >
                    Decline
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleAccept(req.id, req.requester.id)}
                    disabled={actionLoading === req.requester.id}
                  >
                    Accept
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
