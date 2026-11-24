'use client'

import { useCallback, useRef, useState } from 'react'
import { usePlayer } from '@/lib/store/player'
import { clamp, formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SeekBarProps {
  compact?: boolean
  className?: string
  showLabels?: boolean
}

export function SeekBar({ compact = false, className, showLabels = true }: SeekBarProps) {
  const { currentTime, duration, seek, buffered } = usePlayer()
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)
  const [hoverX, setHoverX] = useState<number | null>(null)

  const value = dragging ? dragValue : currentTime
  const pct = duration ? clamp((value / duration) * 100, 0, 100) : 0
  const bufferedPct = duration ? clamp((buffered / duration) * 100, 0, 100) : 0
  const hoverPct =
    hoverX !== null && ref.current
      ? clamp(((hoverX - ref.current.getBoundingClientRect().left) / ref.current.getBoundingClientRect().width) * 100, 0, 100)
      : null

  const compute = useCallback(
    (clientX: number) => {
      const el = ref.current
      if (!el || !duration) return 0
      const rect = el.getBoundingClientRect()
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
      return ratio * duration
    },
    [duration]
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return
    e.preventDefault()
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    setDragging(true)
    setDragValue(compute(e.clientX))
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setHoverX(e.clientX)
    if (!dragging) return
    setDragValue(compute(e.clientX))
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    seek(compute(e.clientX))
    setDragging(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!duration) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      seek(value + 5)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      seek(value - 5)
    } else if (e.key === 'Home') {
      e.preventDefault()
      seek(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      seek(duration)
    }
  }

  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      {showLabels ? (
        <span className="w-9 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-dim">
          {formatDuration(value)}
        </span>
      ) : null}
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(value)}
        aria-valuetext={formatDuration(value)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHoverX(null)}
        onKeyDown={onKeyDown}
        className={cn(
          'group/seek relative flex w-full cursor-pointer items-center py-2',
          'touch-none select-none'
        )}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-full bg-white/[0.13] transition-[height] duration-150',
            compact ? 'h-[3px]' : 'h-1 group-hover/seek:h-[5px]'
          )}
        >
          <div
            className="absolute inset-y-0 left-0 bg-white/[0.18]"
            style={{ width: `${bufferedPct}%` }}
          />
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-colors duration-150',
              dragging ? 'bg-accent' : 'bg-white group-hover/seek:bg-accent-soft'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* hover preview */}
        {hoverPct !== null && !dragging ? (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md bg-fg px-1.5 py-0.5 font-mono text-[10px] text-base opacity-0 transition-opacity duration-150 group-hover/seek:opacity-100"
            style={{ left: `${hoverPct}%` }}
          >
            {formatDuration((hoverPct / 100) * duration)}
          </div>
        ) : null}

        <div
          className={cn(
            'pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white shadow-md transition-transform duration-150',
            'group-hover/seek:scale-100',
            dragging && 'scale-100 bg-accent-soft'
          )}
          style={{ left: `${pct}%` }}
        />
      </div>
      {showLabels ? (
        <span className="w-9 shrink-0 font-mono text-[10.5px] tabular-nums text-dim">
          {formatDuration(duration)}
        </span>
      ) : null}
    </div>
  )
}
