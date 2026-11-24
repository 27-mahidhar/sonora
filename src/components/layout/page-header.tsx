'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CoverArt } from '@/components/cards/cover-art'

interface DetailHeaderProps {
  cover: string
  coverShape?: 'square' | 'circle'
  eyebrow?: ReactNode
  title: string
  subtitle?: ReactNode
  description?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  compact?: boolean
}

/**
 * Hero header for album / artist / playlist / genre / podcast pages.
 * The colour is always pulled from the artwork itself, so the header can
 * never clash with the cover the way a fixed tint would.
 */
export function DetailHeader({
  cover,
  coverShape = 'square',
  eyebrow,
  title,
  subtitle,
  description,
  meta,
  actions,
  compact = false,
}: DetailHeaderProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-base" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-45 blur-[70px] saturate-125"
        style={{
          backgroundImage: `url(${cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-base/45 to-base"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-base/40 via-transparent to-base/30"
      />

      <div
        className={cn(
          'relative flex flex-col items-center gap-6 px-4 pb-8 pt-10 text-center sm:px-6 md:flex-row md:items-end md:gap-7 md:pb-9 md:pt-16 md:text-left lg:px-8',
          compact && 'md:pb-7 md:pt-12'
        )}
      >
        <div
          className={cn(
            'shrink-0 overflow-hidden',
            compact ? 'h-40 w-40 md:h-48 md:w-48' : 'h-48 w-48 md:h-56 md:w-56 lg:h-64 lg:w-64',
            coverShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
          )}
        >
          <CoverArt
            src={cover}
            alt={`${title} artwork`}
            className="h-full w-full"
            rounded={coverShape === 'circle' ? 'rounded-full' : 'rounded-2xl'}
            priority
            sizes="(max-width: 768px) 50vw, 260px"
          />
        </div>

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-fg/70">
              {eyebrow}
            </p>
          ) : null}

          <h1
            className={cn(
              'display text-balance text-fg',
              compact
                ? 'text-[clamp(2rem,5vw,3.2rem)]'
                : 'text-[clamp(2.4rem,6.5vw,5.2rem)] leading-[0.92]'
            )}
          >
            {title}
          </h1>

          {description ? (
            <p className="mt-3 hidden max-w-2xl text-[13px] leading-relaxed text-fg/70 md:block">
              {description}
            </p>
          ) : null}

          {subtitle ? <div className="mt-3 text-[13.5px] text-fg/85">{subtitle}</div> : null}
          {meta ? <div className="mt-1.5 text-[12px] text-fg/60">{meta}</div> : null}

          {actions ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
