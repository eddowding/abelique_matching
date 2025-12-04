'use client'

import { useRouter } from 'next/navigation'
import { Users, Settings, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Group } from '@/types/database'

interface GroupWithMeta extends Group {
  role: string
  member_count: number
  joined_at?: string
}

interface GroupCardProps {
  group: GroupWithMeta
  onSelect?: (group: GroupWithMeta) => void
}

export function GroupCard({ group, onSelect }: GroupCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onSelect) {
      onSelect(group)
    } else {
      router.push(`/groups/${group.id}`)
    }
  }

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/groups/${group.id}/settings`)
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{group.name}</h3>
              {group.role === 'admin' && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
            {group.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {group.member_count} member{group.member_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {group.role === 'admin' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSettings}
                className="h-8 w-8"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
