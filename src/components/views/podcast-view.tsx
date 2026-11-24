'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Calendar, Pause, Play, Rss, UserPlus, UserCheck } from 'lucide-react'
import type { Podcast } from '@/lib/types'
import { podcastToTracks } from '@/lib/catalog-api'
import { usePlayer } from '@/lib/store/player'
import { useToast } from '@/lib/store/toast'
import { useState } from 'react'
import { formatCompact, formatDuration, formatRelativeDate, pluralize, cn } from '@/lib/utils'
import { DetailHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/primitives'

export function PodcastView({ podcast }: { podcast: Podcast }) {
  const tracks = useMemo(() => podcastToTracks(podcast), [podcast])
  const { playQueue, isPlaying, current, pause, resume } = usePlayer()
  const { toast } = useToast()
  const [following, setFollowing] = useState(false)

  const isCurrent = !!current && tracks.some((t) => t.id === current.id)
  const playing = isCurrent && isPlaying

  return (
    <>
      <DetailHeader
        cover={podcast.coverArt}
        eyebrow="Podcast"
        title={podcast.title}
        description={podcast.description}
        meta={
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 md:justify-start">
            <span className="font-medium text-fg/80">Hosted by {podcast.host}</span>
            <span>·</span>
            <span>{pluralize(podcast.episodes.length, 'episode')}</span>
            <span>·</span>
            <span>{formatCompact(podcast.followers)} followers</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={() => (playing ? pause() : isCurrent ? resume() : playQueue(tracks, 0))}
              className="rounded-full px-7"
            >
              {playing ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px] fill-current" />
              )}
              {playing ? 'Pause' : 'Play latest'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setFollowing((v) => !v)
                toast(following ? 'Unfollowed podcast' : 'Following podcast', podcast.title, 'music')
              }}
              className={cn('rounded-full', following && 'text-accent-soft')}
              aria-pressed={following}
            >
              {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {following ? 'Following' : 'Follow'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full px-4"
              onClick={() => toast('RSS link copied', 'Use it in any podcast app.', 'success')}
              aria-label="Copy RSS link"
            >
              <Rss className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <Section
          title="All episodes"
          description="Newest first. Tap any episode to start listening."
        >
          <ul className="divide-y divide-line/[0.06]">
            {podcast.episodes.map((ep, i) => {
              const epTrack = tracks.find((t) => t.id === ep.id)
              const isThis = current?.id === ep.id
              return (
                <li key={ep.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!epTrack) return
                      isThis ? toggleEpisode(isPlaying, pause, resume) : playQueue(tracks, i)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (epTrack) playQueue(tracks, i)
                      }
                    }}
                    className={cn(
                      'group flex cursor-pointer items-start gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-white/[0.04]',
                      isThis && 'bg-white/[0.06]'
                    )}
                  >
                    <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-soft">
                      {isThis && isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 translate-x-[1px] fill-current" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-soft">
                          Episode {ep.episodeNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-dim">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeDate(ep.date)}
                        </span>
                        <span className="text-[10.5px] text-dim">{formatDuration(ep.duration)}</span>
                      </div>
                      <p
                        className={cn(
                          'mt-1 text-[14px] font-medium leading-snug',
                          isThis ? 'text-accent-soft' : 'text-fg'
                        )}
                      >
                        {ep.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">{ep.description}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>
      </div>
    </>
  )
}

function toggleEpisode(isPlaying: boolean, pause: () => void, resume: () => void) {
  isPlaying ? pause() : resume()
}
