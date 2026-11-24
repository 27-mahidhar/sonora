'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Compass, Library } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/library', label: 'Library', icon: Library },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Primary"
      className="glass-strong fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-line/[0.08] pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
              active ? 'text-fg' : 'text-dim hover:text-muted'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-12 items-center justify-center rounded-full transition-all duration-300',
                active && 'bg-white/[0.08]'
              )}
            >
              <Icon className={cn('h-[19px] w-[19px]', active && 'text-accent-soft')} />
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
