'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-glow-sm hover:bg-accent-soft hover:shadow-glow hover:-translate-y-px',
  secondary:
    'bg-elevated text-fg hairline hover:bg-raised hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.6)]',
  ghost: 'text-muted hover:bg-white/[0.06] hover:text-fg',
  outline:
    'border border-line/15 bg-transparent text-fg hover:border-line/30 hover:bg-white/[0.04]',
  danger: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-[12.5px]',
  md: 'h-10 px-5 text-[13.5px]',
  lg: 'h-12 px-7 text-[15px]',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  )
)
Button.displayName = 'Button'

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', size = 'icon', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], 'rounded-full', className)}
      {...props}
    />
  )
)
IconButton.displayName = 'IconButton'
