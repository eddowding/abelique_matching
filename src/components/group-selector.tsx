'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Group } from '@/types/database'

interface GroupWithMeta extends Group {
  role: string
  member_count: number
}

interface GroupSelectorProps {
  currentGroupId?: string
  onGroupChange?: (group: GroupWithMeta) => void
}

export function GroupSelector({ currentGroupId, onGroupChange }: GroupSelectorProps) {
  const router = useRouter()
  const [groups, setGroups] = useState<GroupWithMeta[]>([])
  const [loading, setLoading] = useState(true)

  const currentGroup = groups.find(g => g.id === currentGroupId)

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

  const handleGroupSelect = (group: GroupWithMeta) => {
    if (onGroupChange) {
      onGroupChange(group)
    }
    // Navigate to group's discover page
    router.push(`/groups/${group.id}`)
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Users className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (groups.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/groups')}
      >
        <Plus className="w-4 h-4 mr-2" />
        Join a group
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-[200px]">
          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">
            {currentGroup?.name || 'Select group'}
          </span>
          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {groups.map(group => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleGroupSelect(group)}
            className={currentGroupId === group.id ? 'bg-gray-100' : ''}
          >
            <div className="flex flex-col w-full">
              <span className="font-medium truncate">{group.name}</span>
              <span className="text-xs text-gray-500">
                {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                {group.role === 'admin' && ' · Admin'}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/groups')}>
          <Plus className="w-4 h-4 mr-2" />
          Manage groups
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
