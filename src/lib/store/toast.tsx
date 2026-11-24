'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertCircle, CheckCircle2, Info, Music2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info' | 'music'

interface ToastItem {
  id: string
  title: string
  description?: string
  kind: ToastKind
}

interface ToastContextValue {
  toasts: ToastItem[]
  toast: (title: string, description?: string, kind?: ToastKind) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error: <AlertCircle className="h-4 w-4 text-rose-400" />,
  info: <Info className="h-4 w-4 text-accent-soft" />,
  music: <Music2 className="h-4 w-4 text-accent-soft" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const toast = useCallback(
    (title: string, description?: string, kind: ToastKind = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev.slice(-3), { id, title, description, kind }])
      const timer = setTimeout(() => dismiss(id), 3800)
      timers.current.set(id, timer)
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-[calc(var(--player-h)+1rem)] right-4 z-[90] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 md:bottom-[calc(var(--player-h)+1.25rem)]"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto glass-strong hairline flex items-start gap-3 rounded-xl p-3.5',
              'animate-slide-in-right shadow-float'
            )}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-fg">{t.title}</p>
              {t.description ? (
                <p className="mt-0.5 text-[12px] leading-snug text-muted">{t.description}</p>
              ) : null}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1 text-dim transition-colors hover:bg-white/5 hover:text-fg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
