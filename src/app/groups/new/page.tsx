'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function NewGroupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create group')
      }

      const group = await response.json()
      toast.success('Group created!', {
        description: 'Now share the invite link to get members.',
      })
      router.push(`/groups/${group.id}/settings`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create group'
      setError(message)
      toast.error('Could not create group', {
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
            <CardTitle>Create a New Group</CardTitle>
            <CardDescription>
              Create a group and invite others to join. Matches will only happen between members of this group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Tech Founders Network"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this group about?"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Join Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Optional - leave blank for invite-link only"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  If set, members can join using the group name and this password. An invite link will also be generated.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" disabled={loading || !formData.name.trim()} className="w-full">
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
