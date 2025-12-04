'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Group } from '@/types/database'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface GroupWithMeta extends Group {
  role: string
  member_count: number
}

export default function GroupSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false) // Keep for button icon toggle
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    password: '',
  })

  useEffect(() => {
    async function fetchGroup() {
      try {
        const response = await fetch(`/api/groups/${groupId}`)
        if (response.ok) {
          const data = await response.json()
          setGroup(data)
          setFormData({
            name: data.name || '',
            description: data.description || '',
            password: '',
          })
        } else if (response.status === 403) {
          router.push(`/groups/${groupId}`)
        }
      } catch (error) {
        console.error('Error fetching group:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [groupId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const updateData: Record<string, string> = {
        name: formData.name,
        description: formData.description,
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update group')
      }

      const updatedGroup = await response.json()
      setGroup(prev => prev ? { ...prev, ...updatedGroup } : null)
      setFormData(prev => ({ ...prev, password: '' }))
      toast.success('Settings saved!', {
        description: 'Your group settings have been updated.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update group'
      setError(message)
      toast.error('Failed to save', {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete group')
      }

      router.push('/groups')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete group'
      setError(message)
      toast.error('Failed to delete group', {
        description: message,
      })
      setDeleting(false)
    }
  }

  const copyInviteLink = async () => {
    if (!group?.invite_code) return
    const inviteUrl = `${window.location.origin}/join/${group.invite_code}`
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite link copied!', {
      description: 'Share it with people you want to invite.',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!group || group.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => router.push('/groups')} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/groups/${groupId}`)}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Group
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Group Settings</CardTitle>
            <CardDescription>
              Manage your group settings and invite members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" disabled={saving || !formData.name.trim()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Members</CardTitle>
            <CardDescription>
              Share this link to invite people to join your group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.invite_code}`}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={copyInviteLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Group slug:</strong> {group.slug}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Members can also join using this slug and the group password.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this group and all its data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Group'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the group
                    &quot;{group.name}&quot; and remove all {group.member_count} members, match requests,
                    and connections.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete Group
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
