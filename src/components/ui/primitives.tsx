'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */
export function Section({
  title,
  description,
  action,
  children,
  className,
  size = 'md',
  id,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  id?: string
}) {
  return (
    <section className={cn('group/section', className)} aria-labelledby={id}>
      {(title || action) && (
        <header className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <h2
                id={id}
                className={cn(
                  'font-serif leading-none tracking-tight text-fg',
                  size === 'lg' && 'text-[2rem] sm:text-[2.4rem]',
                  size === 'md' && 'text-[1.5rem] sm:text-[1.85rem]',
                  size === 'sm' && 'text-[1.15rem]'
                )}
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      )}
      {children}
    </section>
  )
}

export function SeeAll({ href, children = 'See all' }: { href: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      className="group/link inline-flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.14em] text-dim transition-colors hover:text-fg"
    >
      {children}
      <span className="transition-transform duration-200 group-hover/link:translate-x-0.5">→</span>
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'hairline rounded-2xl bg-elevated',
        interactive && 'transition-all duration-300 ease-snap hover:-translate-y-0.5 hover:bg-raised',
        className
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-white/[0.055]',
        'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/[0.06] after:to-transparent',
        'after:animate-shimmer after:bg-[length:200%_100%]',
        className
      )}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn('h-3 w-2/3', className)} />
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line/12 px-6 py-16 text-center',
        className
      )}
    >
      {icon ? (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-dim">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-2xl text-fg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bits                                                                */
/* ------------------------------------------------------------------ */
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: 'default' | 'accent' | 'outline' | 'solid'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]',
        variant === 'default' && 'bg-white/[0.08] text-muted',
        variant === 'accent' && 'bg-accent/15 text-accent-soft',
        variant === 'outline' && 'border border-line/15 text-dim',
        variant === 'solid' && 'bg-accent text-white',
        className
      )}
    >
      {children}
    </span>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line/15 bg-white/[0.05] px-1.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-line/[0.07]', className)} />
}
