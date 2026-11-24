'use client'

import Link from 'next/link'
import {
  Heart,
  ListMusic,
  Maximize2,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { usePlayer } from '@/lib/store/player'
import { useLibrary } from '@/lib/store/library'
import { cn } from '@/lib/utils'
import { SeekBar } from './seek-bar'
import { VolumeControl } from './volume-control'

/* ------------------------------------------------------------------ */
/* Mini player (mobile)                                                */
/* ------------------------------------------------------------------ */
function MiniPlayer() {
  const { current, isPlaying, toggle, next, setFullScreen } = usePlayer()
  const { isLiked, toggleLike } = useLibrary()

  if (!current) return null

  return (
    <div className="glass-strong hairline mx-2 mb-1 flex h-14 items-center gap-3 overflow-hidden rounded-2xl px-2.5 shadow-float">
      <button
        onClick={() => setFullScreen(true)}
        aria-label="Open full screen player"
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg art-shadow"
      >
        <img src={current.coverArt} alt="" className="h-full w-full object-cover" />
      </button>
      <button
        onClick={() => setFullScreen(true)}
        className="min-w-0 flex-1 text-left"
        aria-label={`${current.title} by ${current.artistName}`}
      >
        <p className="truncate text-[13px] font-medium text-fg">{current.title}</p>
        <p className="truncate text-[11px] text-dim">{current.artistName}</p>
      </button>
      <button
        onClick={toggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg transition-transform active:scale-90"
      >
        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
      </button>
      <button
        onClick={next}
        aria-label="Next track"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-fg"
      >
        <SkipForward className="h-[18px] w-[18px] fill-current" />
      </button>
      <button
        onClick={() => toggleLike(current.id)}
        aria-label={isLiked(current.id) ? 'Remove from liked songs' : 'Add to liked songs'}
        className={cn(
          'hidden shrink-0 rounded-full p-2 transition-colors sm:block',
          isLiked(current.id) ? 'text-accent-soft' : 'text-dim hover:text-fg'
        )}
      >
        <Heart className={cn('h-4 w-4', isLiked(current.id) && 'fill-current')} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Desktop player                                                      */
/* ------------------------------------------------------------------ */
function DesktopPlayer() {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
    setFullScreen,
    setPanel,
    panel,
    isLoading,
  } = usePlayer()
  const { isLiked, toggleLike } = useLibrary()

  if (!current) {
    return (
      <div className="glass border-t border-line/[0.08]">
        <div className="mx-auto flex h-[88px] max-w-[1600px] items-center justify-between px-6">
          <div className="flex items-center gap-3 opacity-80">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.04]">
              <Volume2 className="h-5 w-5 text-dim" />
            </div>
            <div>
              <p className="text-[13px] text-muted">Nothing playing</p>
              <p className="text-[11px] text-dim">Pick a song to start listening</p>
            </div>
          </div>
          <Link
            href="/explore/songs"
            className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-soft"
          >
            Browse music
          </Link>
        </div>
      </div>
    )
  }

  const liked = isLiked(current.id)

  return (
    <div className="glass relative border-t border-line/[0.08]">
      {/* ambient artwork glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={current.coverArt}
          alt=""
          aria-hidden="true"
          className="h-[300%] w-[300%] -translate-x-1/3 -translate-y-2/3 object-cover opacity-[0.09] blur-3xl saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/90 to-base/70" />
      </div>

      <div className="relative mx-auto grid h-[88px] max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-4 px-5">
        {/* left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setFullScreen(true)}
            aria-label="Open full screen player"
            className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-xl art-shadow transition-transform duration-300 hover:scale-[1.03]"
          >
            <img src={current.coverArt} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Maximize2 className="h-4 w-4 text-white" />
            </span>
          </button>
          <div className="min-w-0">
            <Link
              href={`/album/${current.albumId}`}
              className="block truncate text-[13.5px] font-medium text-fg hover:underline"
            >
              {current.title}
            </Link>
            <Link
              href={`/artist/${current.artistId}`}
              className="block truncate text-[11.5px] text-dim transition-colors hover:text-muted hover:underline"
            >
              {current.artistName}
            </Link>
          </div>
          <button
            onClick={() => toggleLike(current.id)}
            aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
            className={cn(
              'shrink-0 rounded-full p-2 transition-all duration-200',
              liked ? 'text-accent-soft scale-105' : 'text-dim hover:text-fg'
            )}
          >
            <Heart className={cn('h-4 w-4 transition-all', liked && 'fill-current')} />
          </button>
        </div>

        {/* center */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              aria-pressed={shuffle}
              className={cn(
                'relative rounded-full p-2 transition-colors',
                shuffle ? 'text-accent-soft' : 'text-dim hover:text-fg'
              )}
            >
              <Shuffle className="h-[15px] w-[15px]" />
              {shuffle ? (
                <span className="absolute bottom-0.5 left-1/2 h-[2px] w-[2px] -translate-x-1/2 rounded-full bg-accent-soft" />
              ) : null}
            </button>
            <button
              onClick={prev}
              aria-label="Previous track"
              className="rounded-full p-2 text-muted transition-all hover:scale-105 hover:text-fg active:scale-95"
            >
              <SkipBack className="h-[18px] w-[18px] fill-current" />
            </button>
            <button
              onClick={toggle}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-fg text-base transition-all duration-200 hover:scale-105 hover:shadow-glow active:scale-95"
            >
              {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-base/30 border-t-base" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4 translate-x-0 fill-current" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px] fill-current" />
              )}
            </button>
            <button
              onClick={next}
              aria-label="Next track"
              className="rounded-full p-2 text-muted transition-all hover:scale-105 hover:text-fg active:scale-95"
            >
              <SkipForward className="h-[18px] w-[18px] fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              className={cn(
                'relative rounded-full p-2 transition-colors',
                repeat !== 'off' ? 'text-accent-soft' : 'text-dim hover:text-fg'
              )}
            >
              {repeat === 'one' ? (
                <Repeat1 className="h-[15px] w-[15px]" />
              ) : (
                <Repeat className="h-[15px] w-[15px]" />
              )}
              {repeat !== 'off' ? (
                <span className="absolute bottom-0.5 left-1/2 h-[2px] w-[2px] -translate-x-1/2 rounded-full bg-accent-soft" />
              ) : null}
            </button>
          </div>
          <SeekBar compact className="w-full max-w-[560px]" />
        </div>

        {/* right */}
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => setPanel(panel === 'lyrics' ? null : 'lyrics')}
            aria-label="Toggle lyrics"
            aria-pressed={panel === 'lyrics'}
            className={cn(
              'rounded-full p-2 transition-colors',
              panel === 'lyrics' ? 'text-accent-soft' : 'text-dim hover:text-fg'
            )}
          >
            <Mic2 className="h-[16px] w-[16px]" />
          </button>
          <button
            onClick={() => setPanel(panel === 'queue' ? null : 'queue')}
            aria-label="Toggle queue"
            aria-pressed={panel === 'queue'}
            className={cn(
              'rounded-full p-2 transition-colors',
              panel === 'queue' ? 'text-accent-soft' : 'text-dim hover:text-fg'
            )}
          >
            <ListMusic className="h-[17px] w-[17px]" />
          </button>
          <VolumeControl className="ml-1" />
          <button
            onClick={() => setFullScreen(true)}
            aria-label="Full screen player"
            className="rounded-full p-2 text-dim transition-colors hover:text-fg"
          >
            <Maximize2 className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function PlayerBar() {
  const { current } = usePlayer()
  return (
    <>
      <div className="fixed inset-x-0 bottom-16 z-40 lg:hidden">
        <MiniPlayer />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 hidden lg:block">
        <DesktopPlayer />
      </div>
      {/* keeps layout height stable when nothing is playing */}
      <span className="sr-only">{current ? `Now playing: ${current.title}` : ''}</span>
    </>
  )
}
