'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Connection {
  id: string
  created_at: string
  match_reason: string | null
  profile: Profile
}

export default function ConnectionsPage() {
  const router = useRouter()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections')
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
        <p className="text-muted-foreground">Loading connections...</p>
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
              className="rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/requests')}
            >
              Requests
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-none border-b-2 border-primary text-primary"
            >
              Connections {connections.length > 0 && <span className="ml-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">{connections.length}</span>}
            </Button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No connections yet.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              When someone you connect with also connects with you, you&apos;ll see them here.
            </p>
            <Button onClick={() => router.push('/discover')}>
              Find matches
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {connections.length} mutual connection{connections.length !== 1 ? 's' : ''}
            </p>
            {connections.map(conn => (
              <Card key={conn.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-100 text-green-700 font-medium">
                        {getInitials(conn.profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{conn.profile.full_name}</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Connected
                        </Badge>
                      </div>
                      {conn.profile.current_work && (
                        <p className="text-sm text-muted-foreground">
                          {conn.profile.current_work}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {conn.profile.bio && (
                    <p className="text-sm text-gray-700">{conn.profile.bio}</p>
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
                        <a href={`mailto:${conn.profile.email}`} className="text-primary hover:underline">
                          {conn.profile.email}
                        </a>
                      </p>
                      {conn.profile.linkedin_url && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">LinkedIn:</span>{' '}
                          <a
                            href={conn.profile.linkedin_url}
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
      </main>
    </div>
  )
}
