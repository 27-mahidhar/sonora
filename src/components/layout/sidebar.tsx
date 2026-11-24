'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Library,
  Compass,
  Music2,
  Disc3,
  Users2,
  ListMusic,
  AudioLines,
  Podcast,
  Sparkles,
  TrendingUp,
  Plus,
  Heart,
  Clock,
  Settings,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'
import { Logo } from './logo'
import { useLibrary } from '@/lib/store/library'
import { useTheme } from '@/lib/store/theme'
import { useAuth } from '@/lib/store/auth'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/button'

function NavItem({
  href,
  icon,
  children,
  active,
  badge,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
  badge?: React.ReactNode
}) {
  const pathname = usePathname()
  const isActive = active ?? pathname === href
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
        isActive ? 'bg-white/[0.07] text-fg' : 'text-muted hover:bg-white/[0.04] hover:text-fg'
      )}
    >
      <span
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-accent-soft' : 'text-dim group-hover:text-muted'
        )}
      >
        {icon}
      </span>
      <span className="truncate">{children}</span>
      {badge ? <span className="ml-auto shrink-0">{badge}</span> : null}
      {isActive ? (
        <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent" />
      ) : null}
    </Link>
  )
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-dim">
        {title}
      </p>
      <nav className="space-y-0.5">{children}</nav>
    </div>
  )
}

export function Sidebar() {
  const { userPlaylists } = useLibrary()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar flex-col border-r border-line/[0.07] bg-base-soft/60 backdrop-blur-xl lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" aria-label="SONORA home" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 no-scrollbar">
        <nav className="space-y-0.5">
          <NavItem href="/" icon={<Home className="h-[17px] w-[17px]" />}>
            Home
          </NavItem>
          <NavItem href="/search" icon={<Search className="h-[17px] w-[17px]" />}>
            Search
          </NavItem>
          <NavItem href="/library" icon={<Library className="h-[17px] w-[17px]" />}>
            Your Library
          </NavItem>
        </nav>

        <div className="my-5 h-px bg-line/[0.07]" />

        <NavGroup title="Explore">
          <NavItem href="/explore" icon={<Compass className="h-4 w-4" />}>
            Discover
          </NavItem>
          <NavItem href="/explore/songs" icon={<Music2 className="h-4 w-4" />}>
            Songs
          </NavItem>
          <NavItem href="/explore/albums" icon={<Disc3 className="h-4 w-4" />}>
            Albums
          </NavItem>
          <NavItem href="/explore/artists" icon={<Users2 className="h-4 w-4" />}>
            Artists
          </NavItem>
          <NavItem href="/explore/playlists" icon={<ListMusic className="h-4 w-4" />}>
            Playlists
          </NavItem>
          <NavItem href="/explore/genres" icon={<AudioLines className="h-4 w-4" />}>
            Genres
          </NavItem>
          <NavItem href="/explore/podcasts" icon={<Podcast className="h-4 w-4" />}>
            Podcasts
          </NavItem>
          <NavItem href="/explore/new-releases" icon={<Sparkles className="h-4 w-4" />}>
            New Releases
          </NavItem>
          <NavItem href="/explore/trending" icon={<TrendingUp className="h-4 w-4" />}>
            Trending
          </NavItem>
        </NavGroup>

        <div className="my-5 h-px bg-line/[0.07]" />

        <NavGroup title="Your Library">
          <NavItem href="/library?tab=liked" icon={<Heart className="h-4 w-4" />}>
            Liked Songs
          </NavItem>
          <NavItem href="/library?tab=recent" icon={<Clock className="h-4 w-4" />}>
            Recently Played
          </NavItem>
        </NavGroup>

        {userPlaylists.length > 0 ? (
          <>
            <div className="my-5 h-px bg-line/[0.07]" />
            <NavGroup title="Playlists">
              {userPlaylists.slice(0, 8).map((p) => (
                <NavItem key={p.id} href={`/playlist/${p.id}`} icon={<Music2 className="h-4 w-4" />}>
                  {p.name}
                </NavItem>
              ))}
            </NavGroup>
          </>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line/[0.07] p-3">
        <Link
          href="/library?tab=playlists"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-fg"
        >
          <Plus className="h-4 w-4 text-dim" />
          New playlist
        </Link>
        <div className="mt-2 flex items-center justify-between gap-1 px-1">
          <IconButton
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            size="icon-sm"
            className="text-dim hover:text-fg"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>
          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-full p-1.5 text-dim transition-colors hover:text-fg"
          >
            <Settings className="h-4 w-4" />
          </Link>
          {user ? (
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              className="rounded-full p-1.5 text-dim transition-colors hover:text-fg"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : null}
          <Link
            href={user ? '/settings' : '/signin'}
            className="ml-auto flex items-center gap-2 rounded-full p-1 transition-opacity hover:opacity-80"
          >
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-indigo-600 text-[11px] font-semibold text-white">
              {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
