'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CarouselProps {
  children: ReactNode
  className?: string
  itemWidth?: string
  gap?: string
  ariaLabel?: string
}

/**
 * Horizontally scrolling row with scroll-snap, edge fade and hover arrows.
 * Falls back to native touch scrolling on mobile (arrows hidden).
 */
export function Carousel({
  children,
  className,
  itemWidth = 'w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]',
  gap = 'gap-3',
  ariaLabel,
}: CarouselProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update])

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: 'smooth' })
  }

  return (
    <div className={cn('group/carousel relative', className)}>
      <div
        ref={ref}
        onScroll={update}
        aria-label={ariaLabel}
        className={cn(
          'no-scrollbar mask-x flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-1',
          gap
        )}
      >
        {children}
      </div>

      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        disabled={!canPrev}
        className={cn(
          'absolute -left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-[70%] items-center justify-center rounded-full',
          'border border-line/10 bg-elevated/95 text-fg shadow-float backdrop-blur transition-all duration-200',
          'hover:bg-raised hover:scale-105 lg:flex',
          !canPrev ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover/carousel:opacity-100'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        disabled={!canNext}
        className={cn(
          'absolute -right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-[70%] items-center justify-center rounded-full',
          'border border-line/10 bg-elevated/95 text-fg shadow-float backdrop-blur transition-all duration-200',
          'hover:bg-raised hover:scale-105 lg:flex',
          !canNext ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover/carousel:opacity-100'
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
