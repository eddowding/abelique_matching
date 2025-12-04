'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Check, Users, Link2, Calendar, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Group } from '@/types/database'
import { toast } from 'sonner'

interface GroupWithStats extends Group {
  role: string
  member_count: number
  connection_count: number
  profiles_complete: number
}

export default function GroupInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    async function fetchGroup() {
      try {
        const response = await fetch(`/api/groups/${groupId}`)
        if (response.ok) {
          const data = await response.json()
          setGroup(data)
        } else if (response.status === 403) {
          router.push('/groups')
        }
      } catch (error) {
        console.error('Error fetching group:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [groupId, router])

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

  const handleLeaveGroup = async () => {
    setLeaving(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/membership`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Left group', {
          description: `You have left ${group?.name}.`,
        })
        router.push('/groups')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave group')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave group'
      toast.error('Error', { description: message })
      setLeaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-muted-foreground">Group not found.</p>
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
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/groups/${groupId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Group
          </Button>
          {group.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/groups/${groupId}/settings`)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          )}
        </div>

        {/* Group Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{group.name}</CardTitle>
            {group.description && (
              <CardDescription className="text-base mt-2">
                {group.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {group.created_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Created {formatDate(group.created_at)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Link - Prominent */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Invite Link
            </CardTitle>
            <CardDescription>
              Share this link to invite people to join the group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.invite_code}`}
                className="font-mono text-sm bg-white"
              />
              <Button onClick={copyInviteLink} className="shrink-0">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Group Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">
                  {group.member_count}
                </div>
                <div className="text-sm text-muted-foreground">
                  {group.member_count === 1 ? 'Member' : 'Members'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">
                  {group.profiles_complete}
                </div>
                <div className="text-sm text-muted-foreground">
                  Profiles Complete
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center col-span-2">
                <div className="text-3xl font-bold text-blue-600">
                  {group.connection_count}
                </div>
                <div className="text-sm text-muted-foreground">
                  Connections Made
                </div>
              </div>
            </div>
            {group.profiles_complete < group.member_count && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {group.member_count - group.profiles_complete} member{group.member_count - group.profiles_complete !== 1 ? 's' : ''} still need to complete their profile
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/groups/${groupId}`)}
          >
            Browse Matches
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/groups/${groupId}/profile`)}
          >
            Edit Your Profile
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/groups/${groupId}/connections`)}
          >
            View Your Connections
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push('/account')}
          >
            Account Settings
          </Button>
        </div>

        {/* Leave Group */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Leave Group
            </CardTitle>
            <CardDescription>
              Remove yourself from this group. Your connections and match requests in this group will be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={leaving}>
                  {leaving ? 'Leaving...' : 'Leave Group'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave {group.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove you from the group and delete:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Your profile in this group</li>
                      <li>All your connections in this group</li>
                      <li>All your match requests in this group</li>
                    </ul>
                    <p className="mt-2">You can rejoin later using an invite link.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeaveGroup}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Leave Group
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
