'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function JoinGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ slug: '', password: '' })
  const [inviteCode, setInviteCode] = useState('')

  const handlePasswordJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: passwordForm.slug, password: passwordForm.password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join group')
      }

      const result = await response.json()
      toast.success('Welcome to the group!', {
        description: 'Set up your profile to start discovering matches.',
      })
      router.push(`/groups/${result.group_id}/profile`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join group'
      setError(message)
      toast.error('Could not join group', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join group')
      }

      const result = await response.json()
      toast.success('Welcome to the group!', {
        description: 'Set up your profile to start discovering matches.',
      })
      router.push(`/groups/${result.group_id}/profile`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join group'
      setError(message)
      toast.error('Could not join group', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/groups')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Join a Group</CardTitle>
            <CardDescription>
              Join an existing group using a password or invite link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="invite">Invite Code</TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="mt-4">
                <form onSubmit={handlePasswordJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Group Slug</Label>
                    <Input
                      id="slug"
                      placeholder="e.g., tech-founders-network"
                      value={passwordForm.slug}
                      onChange={e => setPasswordForm({ ...passwordForm, slug: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The URL-friendly name of the group (ask the group admin)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter group password"
                      value={passwordForm.password}
                      onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !passwordForm.slug.trim() || !passwordForm.password.trim()}
                    className="w-full"
                  >
                    {loading ? 'Joining...' : 'Join Group'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="invite" className="mt-4">
                <form onSubmit={handleInviteJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite_code">Invite Code</Label>
                    <Input
                      id="invite_code"
                      placeholder="e.g., abc123def456"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the invite code you received from the group admin
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !inviteCode.trim()}
                    className="w-full"
                  >
                    {loading ? 'Joining...' : 'Join Group'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
