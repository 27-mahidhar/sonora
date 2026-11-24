'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Heart,
  ListMusic,
  Maximize2,
  Mic2,
  Minimize2,
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
import { LyricsContent } from './panels'

export function FullScreenPlayer() {
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
    fullScreen,
    setFullScreen,
    setPanel,
    panel,
    isLoading,
  } = usePlayer()
  const { isLiked, toggleLike } = useLibrary()
  const [showLyrics, setShowLyrics] = useState(false)

  useEffect(() => {
    if (fullScreen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [fullScreen])

  if (!current) return null
  const liked = isLiked(current.id)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full screen player"
      className={cn(
        'fixed inset-0 z-[80] flex flex-col overflow-hidden bg-base transition-all duration-300 ease-snap',
        fullScreen ? 'visible opacity-100' : 'invisible opacity-0'
      )}
    >
      {/* backdrop */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={current.coverArt}
          alt=""
          className="h-full w-full scale-125 object-cover opacity-40 blur-[90px] saturate-150 animate-drift"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-base/40 via-base/70 to-base" />
        <div className="absolute inset-0 grain" />
      </div>

      {/* header */}
      <header className="relative z-10 flex shrink-0 items-center justify-between px-4 py-4 sm:px-8">
        <button
          onClick={() => setFullScreen(false)}
          className="group flex items-center gap-2 rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 text-[12px] font-medium text-muted backdrop-blur transition-colors hover:bg-white/[0.12] hover:text-fg"
        >
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
          Now playing
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLyrics((v) => !v)}
            aria-label="Toggle lyrics"
            aria-pressed={showLyrics}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium backdrop-blur transition-colors lg:hidden',
              showLyrics ? 'bg-accent text-white' : 'bg-white/[0.06] text-muted hover:text-fg'
            )}
          >
            <Mic2 className="h-3.5 w-3.5" />
            Lyrics
          </button>
          <button
            onClick={() => setPanel(panel === 'queue' ? null : 'queue')}
            aria-label="Queue"
            className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-medium text-muted backdrop-blur transition-colors hover:text-fg"
          >
            <ListMusic className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Queue</span>
          </button>
          <button
            onClick={() => setFullScreen(false)}
            aria-label="Close full screen player"
            className="rounded-full bg-white/[0.06] p-2 text-muted backdrop-blur transition-colors hover:text-fg"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* body */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-6 pb-6 sm:px-10 lg:flex-row lg:items-center lg:gap-14 lg:px-16 lg:pb-12">
        {/* artwork */}
        <div className="flex flex-1 items-center justify-center lg:flex-[1.05] lg:items-center">
          <div className="relative w-full max-w-[280px] sm:max-w-[380px] lg:max-w-[min(44vh,520px)]">
            <div
              className={cn(
                'art art-shadow grain relative aspect-square w-full overflow-hidden rounded-2xl lg:rounded-3xl',
                isPlaying ? 'shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]' : ''
              )}
            >
              <img
                src={current.coverArt}
                alt={`${current.albumTitle} cover`}
                className={cn(
                  'h-full w-full object-cover transition-transform duration-[1200ms] ease-snap',
                  isPlaying ? 'scale-100' : 'scale-[0.97]'
                )}
              />
              <div className="sheen pointer-events-none absolute inset-0 opacity-60" />
            </div>
            {/* ambient halo */}
            <div
              aria-hidden="true"
              className={cn(
                'absolute -inset-6 -z-10 rounded-[2rem] bg-accent/25 blur-[70px] transition-opacity duration-700',
                isPlaying ? 'opacity-100' : 'opacity-40'
              )}
            />
          </div>
        </div>

        {/* info + lyrics */}
        <div className="flex min-h-0 shrink-0 flex-col justify-end pt-6 lg:flex-[1] lg:justify-center lg:pt-0">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-dim">
                {current.hiRes ? 'Lossless' : 'High quality'}
              </span>
              {current.explicit ? (
                <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-dim">
                  E
                </span>
              ) : null}
            </div>
            <h2 className="display text-balance text-[2.1rem] leading-[0.98] text-fg sm:text-[2.8rem] lg:text-[3.1rem]">
              {current.title}
            </h2>
            <p className="mt-2.5 text-[14px] text-muted">
              <Link
                href={`/artist/${current.artistId}`}
                onClick={() => setFullScreen(false)}
                className="font-medium text-fg/90 underline-offset-4 hover:text-accent-soft hover:underline"
              >
                {current.artistName}
              </Link>
              <span className="mx-2 text-dim">·</span>
              <Link
                href={`/album/${current.albumId}`}
                onClick={() => setFullScreen(false)}
                className="underline-offset-4 hover:text-fg hover:underline"
              >
                {current.albumTitle}
              </Link>
            </p>
          </div>

          {/* seek */}
          <div className="mt-6 w-full lg:mt-8">
            <SeekBar />
          </div>

          {/* controls */}
          <div className="mt-2 flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              aria-pressed={shuffle}
              className={cn(
                'rounded-full p-2.5 transition-colors',
                shuffle ? 'text-accent-soft' : 'text-dim hover:text-fg'
              )}
            >
              <Shuffle className="h-[17px] w-[17px]" />
            </button>
            <button
              onClick={prev}
              aria-label="Previous track"
              className="rounded-full p-2.5 text-fg/85 transition-all hover:scale-105 hover:text-fg active:scale-95"
            >
              <SkipBack className="h-6 w-6 fill-current" />
            </button>
            <button
              onClick={toggle}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-fg text-base shadow-[0_10px_40px_-8px_rgba(0,0,0,0.7)] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-base/30 border-t-base" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6 fill-current" />
              ) : (
                <Play className="h-6 w-6 translate-x-[2px] fill-current" />
              )}
            </button>
            <button
              onClick={next}
              aria-label="Next track"
              className="rounded-full p-2.5 text-fg/85 transition-all hover:scale-105 hover:text-fg active:scale-95"
            >
              <SkipForward className="h-6 w-6 fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              aria-label={`Repeat: ${repeat}`}
              className={cn(
                'rounded-full p-2.5 transition-colors',
                repeat !== 'off' ? 'text-accent-soft' : 'text-dim hover:text-fg'
              )}
            >
              {repeat === 'one' ? <Repeat1 className="h-[17px] w-[17px]" /> : <Repeat className="h-[17px] w-[17px]" />}
            </button>

            <div className="ml-auto flex items-center gap-1 sm:ml-2">
              <button
                onClick={() => toggleLike(current.id)}
                aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
                className={cn(
                  'rounded-full p-2.5 transition-all',
                  liked ? 'text-accent-soft' : 'text-dim hover:text-fg'
                )}
              >
                <Heart className={cn('h-[18px] w-[18px]', liked && 'fill-current')} />
              </button>
              <div className="hidden md:block">
                <VolumeControl />
              </div>
            </div>
          </div>

          {/* lyrics — desktop */}
          <div className="mt-8 hidden min-h-0 max-h-[26vh] flex-1 lg:block">
            <div className="mask-x-r h-full overflow-hidden">
              <LyricsContent />
            </div>
          </div>
        </div>
      </div>

      {/* lyrics — mobile */}
      {showLyrics ? (
        <div className="relative z-10 h-[42vh] shrink-0 border-t border-line/[0.08] px-6 pt-4 lg:hidden">
          <LyricsContent />
        </div>
      ) : null}
    </div>
  )
}
