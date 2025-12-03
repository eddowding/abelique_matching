'use client'

import { Profile } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface ProfileRowProps {
  profile: Profile & { similarity?: number; match_reason?: string | null }
  onConnect: (id: string) => void
  onHide: (id: string) => void
  loading?: boolean
}

export function ProfileRow({ profile, onConnect, onHide, loading }: ProfileRowProps) {
  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const similarityPercent = profile.similarity
    ? Math.round(profile.similarity * 100)
    : null

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={profile.id} className="border rounded-lg px-4 bg-white">
        <AccordionTrigger className="hover:no-underline py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
            <Avatar className="h-10 w-10 shrink-0 self-start mt-0.5">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left overflow-hidden">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{profile.full_name}</h3>
                {similarityPercent && similarityPercent > 0 && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {similarityPercent}%
                  </Badge>
                )}
              </div>
              {profile.current_work && (
                <p className="text-sm text-muted-foreground truncate">
                  {profile.current_work}
                </p>
              )}
              {profile.match_reason && (
                <p className="text-sm text-primary/80 line-clamp-2 mt-0.5">
                  {profile.match_reason}
                </p>
              )}
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pb-4">
          <div className="space-y-4 pt-2">
            {profile.bio && (
              <p className="text-sm text-gray-700">{profile.bio}</p>
            )}

            {profile.match_reason && (
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-sm text-primary font-medium">Why you might click:</p>
                <p className="text-sm text-gray-700 mt-1">{profile.match_reason}</p>
              </div>
            )}

            {profile.looking_for && profile.looking_for.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Looking for</p>
                <div className="flex flex-wrap gap-1">
                  {profile.looking_for.map(item => (
                    <Badge key={item} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.offering && profile.offering.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Can offer</p>
                <div className="flex flex-wrap gap-1">
                  {profile.offering.map(item => (
                    <Badge key={item} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onHide(profile.id)}
                disabled={loading}
              >
                Not Now
              </Button>
              <Button
                size="sm"
                onClick={() => onConnect(profile.id)}
                disabled={loading}
              >
                Connect
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
