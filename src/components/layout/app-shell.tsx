'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'
import { MobileNav } from './mobile-nav'
import { PlayerBar } from '@/components/player/player-bar'
import { FullScreenPlayer } from '@/components/player/full-screen-player'
import { SidePanel } from '@/components/player/panels'

const BARE_ROUTES = ['/signin', '/signup']

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))

  if (bare) return <>{children}</>

  return (
    <>
      <Sidebar />
      <div className="lg:pl-sidebar">
        <TopBar />
        <main className="min-h-screen pb-[9rem] lg:pb-[8rem]">{children}</main>
      </div>
      <PlayerBar />
      <MobileNav />
      <SidePanel />
      <FullScreenPlayer />
    </>
  )
}
