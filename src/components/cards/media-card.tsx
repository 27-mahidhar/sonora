'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { Pause, Play } from 'lucide-react'
import { usePlayer } from '@/lib/store/player'
import { cn } from '@/lib/utils'
import { CoverArt } from './cover-art'

interface MediaCardProps {
  href: string
  title: string
  subtitle?: string
  cover: string
  /** when provided, a play button appears and starts this queue */
  playTracks?: Parameters<ReturnType<typeof usePlayer>['playQueue']>[0]
  meta?: string
  variant?: 'square' | 'circle' | 'wide'
  className?: string
  showPlay?: boolean
  priority?: boolean
}

export function MediaCard({
  href,
  title,
  subtitle,
  cover,
  playTracks,
  meta,
  variant = 'square',
  className,
  showPlay = true,
  priority,
}: MediaCardProps) {
  const { playQueue, isPlaying, toggle, current, pause, resume, queue } = usePlayer()

  const isCurrentContext =
    !!current && !!playTracks && playTracks.some((t) => t.id === current.id)
  const isPlayingThis = isCurrentContext && isPlaying

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!playTracks?.length) return
      if (isCurrentContext) {
        isPlaying ? pause() : resume()
        return
      }
      playQueue(playTracks, 0)
    },
    [playTracks, playQueue, isCurrentContext, isPlaying, pause, resume]
  )

  return (
    <Link
      href={href}
      className={cn(
        'group/card relative block min-w-0 rounded-xl p-2.5 transition-colors duration-200',
        'hover:bg-white/[0.045] focus-visible:bg-white/[0.045]',
        className
      )}
    >
      <div className="relative">
        <CoverArt
          src={cover}
          alt={`${title} artwork`}
          className={cn(
            'aspect-square w-full',
            variant === 'circle' && 'rounded-full' 
          )}
          rounded={variant === 'circle' ? 'rounded-full' : 'rounded-xl'}
          priority={priority}
        />
        {variant === 'square' ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
          />
        ) : null}

        {showPlay && playTracks?.length ? (
          <button
            onClick={handlePlay}
            aria-label={isPlayingThis ? `Pause ${title}` : `Play ${title}`}
            className={cn(
              'absolute bottom-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full',
              'bg-accent text-white shadow-[0_8px_24px_-4px_rgba(139,92,246,0.8)]',
              'transition-all duration-300 ease-snap hover:scale-105 hover:bg-accent-soft',
              'translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100',
              'focus-visible:translate-y-0 focus-visible:opacity-100',
              isPlayingThis && 'translate-y-0 opacity-100'
            )}
          >
            {isPlayingThis ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 translate-x-[1px] fill-current" />
            )}
          </button>
        ) : null}

        {isCurrentContext && !isPlayingThis ? (
          <span className="eq absolute bottom-2 right-2 z-10 h-3 text-white drop-shadow">
            <span /><span /><span /><span />
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 min-w-0 px-0.5">
        <p className="truncate text-[13px] font-medium leading-snug text-fg">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11.5px] leading-snug text-dim">{subtitle}</p>
        ) : null}
        {meta ? <p className="mt-1 truncate text-[10.5px] text-dim/70">{meta}</p> : null}
      </div>
    </Link>
  )
}
