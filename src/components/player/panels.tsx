'use client'

import { useEffect, useMemo, useRef } from 'react'
import { ListMusic, Music2, X, Mic2 } from 'lucide-react'
import { usePlayer } from '@/lib/store/player'
import { useLibrary } from '@/lib/store/library'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/button'

/* ------------------------------------------------------------------ */
/* Side panel shell (queue / lyrics tabs)                              */
/* ------------------------------------------------------------------ */
export function SidePanel() {
  const { panel, setPanel } = usePlayer()
  const open = panel !== null

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'fixed inset-x-0 bottom-0 top-0 z-50 flex w-full flex-col border-l border-line/[0.08] bg-base-soft/95 backdrop-blur-2xl transition-transform duration-300 ease-snap',
        'lg:inset-x-auto lg:right-0 lg:bottom-[var(--player-h)] lg:top-0 lg:w-[390px]',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line/[0.07] px-5">
        <div className="flex items-center gap-1 rounded-full bg-white/[0.05] p-1">
          <TabButton active={panel === 'queue'} onClick={() => setPanel('queue')}>
            <ListMusic className="h-3.5 w-3.5" />
            Queue
          </TabButton>
          <TabButton active={panel === 'lyrics'} onClick={() => setPanel('lyrics')}>
            <Mic2 className="h-3.5 w-3.5" />
            Lyrics
          </TabButton>
        </div>
        <IconButton
          onClick={() => setPanel(null)}
          aria-label="Close panel"
          size="icon-sm"
          className="text-dim hover:text-fg"
        >
          <X className="h-4 w-4" />
        </IconButton>
      </header>
      {panel === 'queue' ? <QueueContent /> : <LyricsContent />}
    </aside>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-all duration-200',
        active ? 'bg-white/[0.1] text-fg' : 'text-dim hover:text-muted'
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Queue                                                               */
/* ------------------------------------------------------------------ */
function QueueContent() {
  const { queue, index, current, jumpTo, removeFromQueue, clearQueue } = usePlayer()
  const { isLiked } = useLibrary()

  const nowPlaying = current
  const nextUp = queue.map((t, i) => ({ t, i })).filter(({ i }) => i > index)
  const previous = queue.map((t, i) => ({ t, i })).filter(({ i }) => i < index).reverse()

  return (
    <div className="flex-1 overflow-y-auto px-2 py-3 no-scrollbar">
      {nowPlaying ? (
        <section className="mb-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-soft">
            Now playing
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <img src={nowPlaying.coverArt} alt="" className="h-full w-full object-cover" />
              <span className="eq absolute bottom-1 right-1 h-3 text-white">
                <span /><span /><span /><span />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{nowPlaying.title}</p>
              <p className="truncate text-[11.5px] text-dim">{nowPlaying.artistName}</p>
            </div>
            <span className="font-mono text-[10.5px] tabular-nums text-dim">
              {formatDuration(nowPlaying.duration)}
            </span>
          </div>
        </section>
      ) : null}

      <div className="mb-2 flex items-center justify-between px-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">Next up</p>
        {nextUp.length ? (
          <button
            onClick={clearQueue}
            className="text-[11px] font-medium text-dim transition-colors hover:text-fg"
          >
            Clear
          </button>
        ) : null}
      </div>

      {nextUp.length ? (
        <ul className="space-y-0.5">
          {nextUp.map(({ t, i }) => (
            <QueueRow
              key={`${t.id}-${i}`}
              title={t.title}
              artist={t.artistName}
              cover={t.coverArt}
              duration={t.duration}
              liked={isLiked(t.id)}
              onPlay={() => jumpTo(i)}
              onRemove={() => removeFromQueue(i)}
            />
          ))}
        </ul>
      ) : (
        <p className="px-3 py-6 text-center text-[12px] text-dim">Nothing else in the queue.</p>
      )}

      {previous.length ? (
        <section className="mt-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">
            Previously played
          </p>
          <ul className="space-y-0.5">
            {previous.map(({ t, i }) => (
              <QueueRow
                key={`${t.id}-${i}`}
                title={t.title}
                artist={t.artistName}
                cover={t.coverArt}
                duration={t.duration}
                liked={isLiked(t.id)}
                dimmed
                onPlay={() => jumpTo(i)}
                onRemove={() => removeFromQueue(i)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function QueueRow({
  title,
  artist,
  cover,
  duration,
  liked,
  onPlay,
  onRemove,
  dimmed,
}: {
  title: string
  artist: string
  cover: string
  duration: number
  liked: boolean
  onPlay: () => void
  onRemove: () => void
  dimmed?: boolean
}) {
  return (
    <li className="group/row relative">
      <button
        onClick={onPlay}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.06]',
          dimmed && 'opacity-55 hover:opacity-100'
        )}
      >
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md">
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-fg">{title}</p>
          <p className="truncate text-[11px] text-dim">{artist}</p>
        </div>
        {liked ? <Music2 className="h-3 w-3 shrink-0 text-accent-soft" /> : null}
        <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-dim">
          {formatDuration(duration)}
        </span>
      </button>
      <button
        onClick={onRemove}
        aria-label={`Remove ${title} from queue`}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-dim opacity-0 transition-all hover:bg-white/10 hover:text-fg focus-visible:opacity-100 group-hover/row:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Lyrics                                                              */
/* ------------------------------------------------------------------ */
export function LyricsContent({ large = false }: { large?: boolean }) {
  const { current, currentTime, seek } = usePlayer()
  const listRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLParagraphElement>(null)

  const lyrics = current?.lyrics ?? []
  const instrumental = current?.instrumental ?? false

  const activeIndex = useMemo(() => {
    if (!lyrics.length) return -1
    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].t <= currentTime + 0.15) idx = i
      else break
    }
    return idx
  }, [currentTime, lyrics])

  useEffect(() => {
    if (!activeRef.current || !listRef.current) return
    const el = activeRef.current
    const container = listRef.current
    const top = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2
    container.scrollTo({ top, behavior: 'smooth' })
  }, [activeIndex])

  if (instrumental || !lyrics.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">
          <Music2 className="h-6 w-6 text-dim" />
        </div>
        <p className="font-serif text-xl text-fg">
          {instrumental ? 'Instrumental' : 'Lyrics unavailable'}
        </p>
        <p className="mt-1.5 text-[12.5px] text-muted">
          {instrumental
            ? 'This track has no vocals — just sound.'
            : 'Lyrics for this track haven’t been added yet.'}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={listRef}
      className={cn(
        'no-scrollbar flex-1 overflow-y-auto px-6 py-10',
        large ? 'space-y-5' : 'space-y-3.5'
      )}
    >
      {lyrics.map((line, i) => {
        const active = i === activeIndex
        const passed = i < activeIndex
        return (
          <p
            key={`${line.t}-${i}`}
            ref={active ? activeRef : undefined}
            onClick={() => seek(line.t)}
            className={cn(
              'cursor-pointer transition-all duration-300 ease-snap',
              large ? 'text-[26px] leading-[1.35] sm:text-[30px]' : 'text-[19px] leading-[1.4]',
              active
                ? 'text-fg drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]'
                : passed
                  ? 'text-dim/45'
                  : 'text-dim/25',
              active && 'scale-[1.01]'
            )}
          >
            {line.text}
          </p>
        )
      })}
      <p className="pt-6 text-center text-[10px] uppercase tracking-[0.2em] text-dim/50">
        Lyrics · SONORA
      </p>
    </div>
  )
}
