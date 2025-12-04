'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GroupCard } from '@/components/group-card'
import { AppShell } from '@/components/app-shell'
import { Group } from '@/types/database'

interface GroupWithMeta extends Group {
  role: string
  member_count: number
  joined_at?: string
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch('/api/groups')
        if (response.ok) {
          const data = await response.json()
          setGroups(data)
        }
      } catch (error) {
        console.error('Error fetching groups:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Groups</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/groups/join')}>
              <Link2 className="w-4 h-4 mr-2" />
              Join Group
            </Button>
            <Button onClick={() => router.push('/groups/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t joined any groups yet.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Create a new group or join an existing one to start matching with others.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/groups/join')}>
                Join a Group
              </Button>
              <Button onClick={() => router.push('/groups/new')}>
                Create a Group
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
