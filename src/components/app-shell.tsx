'use client'

import { useRouter } from 'next/navigation'
import { Users, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1
              className="text-xl font-bold tracking-tight cursor-pointer"
              onClick={() => router.push('/groups')}
            >
              Abelique
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/groups')}
              >
                <Users className="w-4 h-4 mr-2" />
                My Groups
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/account')}
              >
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
