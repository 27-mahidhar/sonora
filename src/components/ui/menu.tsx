'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Menu({
  trigger,
  children,
  align = 'right',
  className,
  width = 'w-52',
}: {
  trigger: (props: { open: boolean }) => ReactNode
  children: (props: { close: () => void }) => ReactNode
  align?: 'left' | 'right'
  className?: string
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger({ open })}</div>
      {open ? (
        <div
          role="menu"
          className={cn(
            'glass-strong hairline absolute top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl p-1.5 shadow-float animate-scale-in',
            width,
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      ) : null}
    </div>
  )
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
  disabled,
}: {
  icon?: ReactNode
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors',
        danger
          ? 'text-rose-400 hover:bg-rose-500/10'
          : 'text-muted hover:bg-white/[0.06] hover:text-fg',
        disabled && 'pointer-events-none opacity-40'
      )}
    >
      {icon ? <span className="shrink-0 text-dim">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line/[0.07]" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
      {children}
    </p>
  )
}
