'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from './button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
  /** bottom-sheet on mobile, centred dialog on desktop */
  sheet?: boolean
  hideClose?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  sheet = true,
  hideClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        className={cn(
          'relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden bg-elevated shadow-float',
          sheet
            ? 'animate-slide-up rounded-t-3xl sm:animate-scale-in sm:rounded-2xl sm:max-w-md'
            : 'animate-scale-in rounded-2xl sm:max-w-md',
          className
        )}
      >
        {(title || !hideClose) && (
          <header className="flex shrink-0 items-start justify-between gap-4 px-5 pt-5">
            <div className="min-w-0">
              {title ? <h2 className="text-[16px] font-semibold text-fg">{title}</h2> : null}
              {description ? (
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
              ) : null}
            </div>
            {!hideClose ? (
              <IconButton
                onClick={onClose}
                aria-label="Close dialog"
                size="icon-sm"
                className="-mr-2 -mt-1 shrink-0 text-dim hover:text-fg"
              >
                <X className="h-4 w-4" />
              </IconButton>
            ) : null}
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-3 no-scrollbar">{children}</div>
      </div>
    </div>,
    document.body
  )
}

/** Lightweight confirmation dialog */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} sheet={false}>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="rounded-full px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={cn(
            'rounded-full px-4 py-2 text-[13px] font-medium text-white transition-colors',
            danger ? 'bg-rose-500 hover:bg-rose-400' : 'bg-accent hover:bg-accent-soft'
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
