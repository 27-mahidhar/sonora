import { cn } from '@/lib/utils'

export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]',
        'bg-[linear-gradient(140deg,#a78bfa_0%,#7c3aed_55%,#4c1d95_100%)]',
        'shadow-[0_2px_12px_-2px_rgba(139,92,246,0.7)]',
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" fill="none">
        <rect x="4" y="12" width="3.2" height="8" rx="1.6" fill="white" opacity="0.55" />
        <rect x="9.4" y="7" width="3.2" height="18" rx="1.6" fill="white" opacity="0.8" />
        <rect x="14.8" y="3" width="3.2" height="26" rx="1.6" fill="white" />
        <rect x="20.2" y="8" width="3.2" height="16" rx="1.6" fill="white" opacity="0.8" />
        <rect x="25.6" y="13" width="3.2" height="6" rx="1.6" fill="white" opacity="0.55" />
      </svg>
    </span>
  )
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) return <LogoMark className={className ?? 'h-7 w-7'} />
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-7 w-7" />
      <span className="font-serif text-[1.55rem] leading-none tracking-[-0.01em] text-fg">
        SONORA
      </span>
    </span>
  )
}
