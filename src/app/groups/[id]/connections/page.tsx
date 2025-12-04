'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Group, GroupProfileData } from '@/types/database'

interface GroupWithMeta extends Group {
  role: string
  member_count: number
}

interface Connection {
  id: string
  created_at: string
  match_reason: string | null
  other_user: {
    id: string
    full_name: string
    email: string
    linkedin_url: string | null
    profile_data: GroupProfileData
  }
}

export default function GroupConnectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithMeta | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    fetchGroup()
    fetchConnections()
    fetchRequestCount()
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

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/connections`)
      if (response.ok) {
        const data = await response.json()
        setConnections(data)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequestCount = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/match-requests`)
      if (response.ok) {
        const data = await response.json()
        setRequestCount(data.length)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
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
          <p className="text-muted-foreground text-center py-20">Loading connections...</p>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}/requests`)}
          >
            Requests {requestCount > 0 && `(${requestCount})`}
          </Button>
          <Button variant="default" size="sm">
            Connections {connections.length > 0 && `(${connections.length})`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}/profile`)}
          >
            Profile
          </Button>
        </div>

        {/* Connections */}
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No connections yet.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              When someone you connect with also connects with you, you&apos;ll see them here.
            </p>
            <Button onClick={() => router.push(`/groups/${groupId}`)}>
              Find matches
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {connections.length} mutual connection{connections.length !== 1 ? 's' : ''}
            </p>
            {connections.map(conn => (
              <Card key={conn.id} className="shadow-sm border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-100 text-green-700 font-medium">
                        {getInitials(conn.other_user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{conn.other_user.full_name}</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Connected
                        </Badge>
                      </div>
                      {conn.other_user.profile_data?.current_work && (
                        <p className="text-sm text-muted-foreground">
                          {conn.other_user.profile_data.current_work}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conn.other_user.profile_data?.bio && (
                    <p className="text-sm text-gray-700">{conn.other_user.profile_data.bio}</p>
                  )}

                  {conn.match_reason && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{conn.match_reason}</p>
                    </div>
                  )}

                  {/* Contact info - revealed after mutual match */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-gray-900">Contact Info</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Email:</span>{' '}
                        <a href={`mailto:${conn.other_user.email}`} className="text-primary hover:underline">
                          {conn.other_user.email}
                        </a>
                      </p>
                      {(conn.other_user.linkedin_url || conn.other_user.profile_data?.linkedin_url) && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">LinkedIn:</span>{' '}
                          <a
                            href={conn.other_user.linkedin_url || conn.other_user.profile_data?.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Profile
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Connected {new Date(conn.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
