'use client'

import { useRef, useState } from 'react'
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '@/lib/store/player'
import { clamp } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function VolumeControl({ className }: { className?: string }) {
  const { volume, muted, setVolume, toggleMute } = usePlayer()
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const effective = muted ? 0 : volume
  const Icon = muted || volume === 0 ? VolumeX : volume < 0.34 ? Volume : volume < 0.68 ? Volume1 : Volume2

  const compute = (clientX: number) => {
    const el = ref.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    return clamp((clientX - rect.left) / rect.width, 0, 1)
  }

  return (
    <div className={cn('group/vol flex items-center gap-1.5', className)}>
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="rounded-full p-1.5 text-muted transition-colors hover:text-fg"
      >
        <Icon className="h-[17px] w-[17px]" />
      </button>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(effective * 100)}
        onPointerDown={(e) => {
          e.preventDefault()
          try {
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
          setDragging(true)
          setVolume(compute(e.clientX))
        }}
        onPointerMove={(e) => {
          if (dragging) setVolume(compute(e.clientX))
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setVolume(volume + 0.05)
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setVolume(volume - 0.05)
          }
        }}
        className="relative flex w-24 cursor-pointer items-center py-2"
      >
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.13] transition-[height] group-hover/vol:h-[5px]">
          <div
            className="h-full rounded-full bg-muted transition-colors group-hover/vol:bg-fg"
            style={{ width: `${effective * 100}%` }}
          />
        </div>
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-fg transition-transform duration-150 group-hover/vol:scale-100"
          style={{ left: `${effective * 100}%` }}
        />
      </div>
    </div>
  )
}
