'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Stats {
  totalUsers: number
  newUsersThisWeek: number
  totalConnections: number
  pendingRequests: number
  usersWithEmbeddings: number
}

interface User {
  id: string
  full_name: string
  email: string
  bio: string | null
  current_work: string | null
  looking_for: string[] | null
  offering: string[] | null
  linkedin_url: string | null
  created_at: string
  hasEmbedding: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.status === 403) {
        setError('You do not have admin access')
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data.stats)
      setUsers(data.allUsers)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const triggerNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${prompt('Enter CRON_SECRET:') || ''}`,
        },
      })
      const data = await response.json()
      alert(`Notifications: ${data.sent || 0} sent, ${data.skipped || 0} skipped, ${data.failed || 0} failed`)
    } catch (err) {
      alert('Failed to trigger notifications: ' + err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/discover')}>Back to App</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={triggerNotifications}>
              Send Pending Emails
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/discover')}>
              Back to App
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalUsers || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>New This Week</CardDescription>
              <CardTitle className="text-3xl">{stats?.newUsersThisWeek || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Connections Made</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalConnections || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-3xl">{stats?.pendingRequests || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>With Embeddings</CardDescription>
              <CardTitle className="text-3xl">{stats?.usersWithEmbeddings || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* User List */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
                <CardDescription>Click on a user to see details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {users.map(user => (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser?.id === user.id ? 'bg-primary/5 border-primary' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          {user.hasEmbedding ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Embedded
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              No Embedding
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Detail */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>User Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedUser.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    {selectedUser.linkedin_url && (
                      <div>
                        <p className="text-sm text-muted-foreground">LinkedIn</p>
                        <a
                          href={selectedUser.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    )}
                    <Separator />
                    {selectedUser.bio && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bio</p>
                        <p className="text-sm">{selectedUser.bio}</p>
                      </div>
                    )}
                    {selectedUser.current_work && (
                      <div>
                        <p className="text-sm text-muted-foreground">Current Work</p>
                        <p className="text-sm">{selectedUser.current_work}</p>
                      </div>
                    )}
                    {selectedUser.looking_for && selectedUser.looking_for.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Looking For</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedUser.looking_for.map(item => (
                            <Badge key={item} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedUser.offering && selectedUser.offering.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Offering</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedUser.offering.map(item => (
                            <Badge key={item} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="text-xs font-mono">{selectedUser.id}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a user to see details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
