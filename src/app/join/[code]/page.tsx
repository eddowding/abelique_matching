'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function JoinInvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code: inviteCode } = use(params)
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_member'>('loading')
  const [groupId, setGroupId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function joinGroup() {
      try {
        const response = await fetch('/api/groups/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invite_code: inviteCode }),
        })

        // If unauthorized, redirect to login with return path
        if (response.status === 401) {
          const returnPath = `/join/${inviteCode}`
          router.push(`/login?next=${encodeURIComponent(returnPath)}`)
          return
        }

        const data = await response.json()

        if (response.ok) {
          setGroupId(data.group_id)
          setGroupName(data.group_name)
          setStatus(data.already_member ? 'already_member' : 'success')

          // Celebrate successful join
          if (!data.already_member) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            })
          }
        } else {
          setError(data.error || 'Failed to join group')
          setStatus('error')
        }
      } catch {
        setError('An error occurred. Please try again.')
        setStatus('error')
      }
    }

    joinGroup()
  }, [inviteCode, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              <CardTitle>Joining group...</CardTitle>
              <CardDescription>Please wait while we add you to the group.</CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Welcome to {groupName}!</CardTitle>
              <CardDescription>
                You&apos;ve successfully joined the group. Set up your profile to start matching.
              </CardDescription>
            </>
          )}

          {status === 'already_member' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <CardTitle>Already a member</CardTitle>
              <CardDescription>
                You&apos;re already a member of {groupName}.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <CardTitle>Unable to join</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {status === 'success' && groupId && (
            <>
              <Button
                className="w-full"
                onClick={() => router.push(`/groups/${groupId}/profile`)}
              >
                Set Up Profile
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/groups/${groupId}`)}
              >
                Go to Group
              </Button>
            </>
          )}

          {status === 'already_member' && groupId && (
            <Button
              className="w-full"
              onClick={() => router.push(`/groups/${groupId}`)}
            >
              Go to Group
            </Button>
          )}

          {status === 'error' && (
            <>
              <Button
                className="w-full"
                onClick={() => router.push('/groups/join')}
              >
                Try Different Code
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/groups')}
              >
                Back to Groups
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
