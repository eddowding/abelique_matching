'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  requestCount?: number
  connectionCount?: number
}

export function AppShell({ children, requestCount = 0, connectionCount = 0 }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    { name: 'Discover', href: '/discover', active: pathname === '/discover' },
    { name: 'Requests', href: '/requests', active: pathname === '/requests', count: requestCount },
    { name: 'Connections', href: '/connections', active: pathname === '/connections', count: connectionCount, countColor: 'bg-green-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1
              className="text-xl font-bold tracking-tight cursor-pointer"
              onClick={() => router.push('/discover')}
            >
              Match
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/profile')}
              className={cn(
                pathname === '/profile' && 'bg-gray-100'
              )}
            >
              Profile
            </Button>
          </div>
          <nav className="flex gap-1 mt-3 -mb-3">
            {tabs.map(tab => (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-none border-b-2 transition-colors',
                  tab.active
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.name}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'ml-1.5 text-xs px-1.5 py-0.5 rounded-full text-white',
                    tab.countColor || 'bg-gray-900'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
