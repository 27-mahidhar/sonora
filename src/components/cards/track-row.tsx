'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import {
  Heart,
  ListPlus,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  ListMusic,
  Disc3,
  Users2,
} from 'lucide-react'
import type { Track } from '@/lib/types'
import { usePlayer } from '@/lib/store/player'
import { useLibrary } from '@/lib/store/library'
import { useToast } from '@/lib/store/toast'
import { cn, formatDuration } from '@/lib/utils'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/menu'
import { AddToPlaylistSheet } from '@/components/library/add-to-playlist'

interface TrackRowProps {
  track: Track
  index: number
  context?: Track[]
  showAlbum?: boolean
  showCover?: boolean
  className?: string
  draggable?: boolean
}

export function TrackRow({
  track,
  index,
  context,
  showAlbum = true,
  showCover = true,
  className,
}: TrackRowProps) {
  const { playTrack, playQueue, isPlaying, current, toggle, pause, resume, addToQueue, playNext } =
    usePlayer()
  const { isLiked, toggleLike } = useLibrary()
  const { toast } = useToast()
  const [playlistOpen, setPlaylistOpen] = useState(false)

  const queueContext = context && context.length ? context : [track]
  const isCurrent = current?.id === track.id
  const isPlayingThis = isCurrent && isPlaying
  const liked = isLiked(track.id)

  const play = useCallback(() => {
    if (isCurrent) {
      isPlaying ? pause() : resume()
      return
    }
    playQueue(queueContext, queueContext.findIndex((t) => t.id === track.id))
  }, [isCurrent, isPlaying, pause, resume, playQueue, queueContext, track.id])

  const onRowClick = () => {
    if (isCurrent) {
      toggle()
    } else {
      play()
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${isPlayingThis ? 'Pause' : 'Play'} ${track.title} by ${track.artistName}`}
        onClick={onRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onRowClick()
          }
        }}
        onDoubleClick={() => !isCurrent && play()}
        className={cn(
          'group/track grid grid-cols-[1.75rem_minmax(0,1fr)_2.25rem_2.5rem] items-center gap-2 rounded-lg px-2 py-1.5',
          'transition-colors duration-150 md:grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,0.75fr)_2.25rem_2.5rem_2.25rem] md:gap-3 md:px-3',
          'hover:bg-white/[0.05] focus-visible:bg-white/[0.06]',
          isCurrent && 'bg-white/[0.06]'
        )}
      >
        {/* index / play */}
        <div className="relative flex h-8 items-center justify-center">
          <span
            className={cn(
              'text-[12px] tabular-nums text-dim transition-opacity duration-150',
              isCurrent && 'text-accent-soft',
              'group-hover/track:opacity-0'
            )}
          >
            {isCurrent ? (
              <span className="eq h-3 text-accent-soft">
                <span /><span /><span /><span />
              </span>
            ) : (
              index + 1
            )}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRowClick()
            }}
            aria-label={isPlayingThis ? `Pause ${track.title}` : `Play ${track.title}`}
            className="absolute inset-0 flex items-center justify-center text-fg opacity-0 transition-opacity duration-150 group-hover/track:opacity-100"
          >
            {isPlayingThis ? (
              <Pause className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-3.5 w-3.5 translate-x-[1px] fill-current" />
            )}
          </button>
        </div>

        {/* cover + title */}
        <div className="flex min-w-0 items-center gap-3">
          {showCover ? (
            <div className="art h-9 w-9 shrink-0 overflow-hidden rounded-md art-shadow">
              <img src={track.coverArt} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="min-w-0">
            <p
              className={cn(
                'truncate text-[13px] font-medium leading-snug',
                isCurrent ? 'text-accent-soft' : 'text-fg'
              )}
            >
              {track.title}
              {track.explicit ? (
                <span className="ml-1.5 rounded border border-line/20 px-1 py-px align-middle text-[8px] font-semibold uppercase leading-none text-dim">
                  E
                </span>
              ) : null}
            </p>
            <Link
              href={`/artist/${track.artistId}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-[11.5px] leading-snug text-dim transition-colors hover:text-muted hover:underline"
            >
              {track.artistName}
            </Link>
          </div>
        </div>

        {/* album */}
        {showAlbum ? (
          <Link
            href={`/album/${track.albumId}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden truncate text-[12px] text-dim transition-colors hover:text-muted hover:underline md:block"
          >
            {track.albumTitle}
          </Link>
        ) : null}

        {/* like */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleLike(track.id)
            toast(liked ? 'Removed from Liked Songs' : 'Added to Liked Songs', track.title, 'music')
          }}
          aria-label={liked ? `Remove ${track.title} from liked songs` : `Like ${track.title}`}
          aria-pressed={liked}
          className={cn(
            'flex h-8 items-center justify-center rounded-full transition-all duration-200',
            liked
              ? 'text-accent-soft'
              : 'text-dim opacity-0 hover:text-fg group-hover/track:opacity-100 focus-visible:opacity-100'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} />
        </button>

        {/* duration */}
        <span className="text-right font-mono text-[11px] tabular-nums text-dim">
          {formatDuration(track.duration)}
        </span>

        {/* more */}
        <Menu
          trigger={({ open }) => (
            <button
              onClick={(e) => e.stopPropagation()}
              aria-label={`More options for ${track.title}`}
              aria-expanded={open}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-dim transition-all hover:text-fg',
                !open && 'opacity-0 group-hover/track:opacity-100 focus-visible:opacity-100'
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <MenuItem
                icon={<ListPlus className="h-3.5 w-3.5" />}
                onClick={() => {
                  addToQueue(track)
                  close()
                }}
              >
                Add to queue
              </MenuItem>
              <MenuItem
                icon={<Play className="h-3.5 w-3.5" />}
                onClick={() => {
                  playNext(track)
                  close()
                }}
              >
                Play next
              </MenuItem>
              <MenuItem
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => {
                  close()
                  setPlaylistOpen(true)
                }}
              >
                Add to playlist
              </MenuItem>
              <MenuSeparator />
              <MenuLabel>Go to</MenuLabel>
              <MenuItem
                icon={<Disc3 className="h-3.5 w-3.5" />}
                onClick={() => {
                  close()
                  window.location.href = `/album/${track.albumId}`
                }}
              >
                Album
              </MenuItem>
              <MenuItem
                icon={<Users2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  close()
                  window.location.href = `/artist/${track.artistId}`
                }}
              >
                Artist
              </MenuItem>
              <MenuItem
                icon={<ListMusic className="h-3.5 w-3.5" />}
                onClick={() => {
                  close()
                  addToQueue(track)
                }}
              >
                View credits
              </MenuItem>
            </>
          )}
        </Menu>
      </div>

      <AddToPlaylistSheet track={track} open={playlistOpen} onClose={() => setPlaylistOpen(false)} />
    </>
  )
}
