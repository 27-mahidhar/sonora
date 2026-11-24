'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Heart,
  Search,
  Sun,
  Moon,
  Settings,
  LogOut,
  Music2,
  Users2,
  Disc3,
  ListMusic,
  Podcast,
  X,
} from 'lucide-react'
import { LogoMark } from './logo'
import { useTheme } from '@/lib/store/theme'
import { useAuth } from '@/lib/store/auth'
import { usePlayer } from '@/lib/store/player'
import { searchCatalog } from '@/lib/catalog-api'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/button'
import { Kbd } from '@/components/ui/primitives'

export function TopBar() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { current } = usePlayer()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const results = query.trim().length > 0 ? searchCatalog(query, 4) : null

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  const hasAny = results && Object.values(results).some((a) => a.length > 0)

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/[0.06] px-4 sm:px-6 lg:px-8">

      <Link href="/" aria-label="SONORA home" className="mr-1 lg:hidden">
        <LogoMark className="h-8 w-8" />
      </Link>

      <div className="hidden items-center gap-1 md:flex">
        <IconButton
          onClick={() => router.back()}
          aria-label="Go back"
          size="icon-sm"
          className="text-dim hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() => router.forward()}
          aria-label="Go forward"
          size="icon-sm"
          className="text-dim hover:text-fg"
        >
          <ArrowRight className="h-4 w-4" />
        </IconButton>
      </div>

      {/* Search */}
      <div ref={boxRef} className="relative mx-auto w-full max-w-xl">
        <form onSubmit={submit} role="search">
          <label htmlFor="global-search" className="sr-only">
            Search songs, artists, albums and playlists
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <input
              id="global-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder={narrow ? 'Search' : 'Search songs, artists, albums…'}
              aria-label="Search"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-full border border-line/10 bg-elevated/80 pl-10 pr-20 text-[13.5px] text-fg outline-none transition-all duration-200 placeholder:text-dim placeholder:truncate focus:border-accent/40 focus:bg-elevated focus:shadow-glow-sm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setOpen(false)
                }}
                aria-label="Clear search"
                className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1 text-dim hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
              <Kbd>/</Kbd>
            </span>
          </div>
        </form>

        {open && query.trim() ? (
          <div className="glass-strong hairline absolute left-0 right-0 top-[calc(100%+0.5rem)] max-h-[70vh] overflow-y-auto rounded-2xl p-2 shadow-float animate-scale-in">
            {!hasAny ? (
              <p className="px-4 py-8 text-center text-[13px] text-muted">
                No results for <span className="text-fg">“{query}”</span>
              </p>
            ) : (
              <>
                {results?.tracks.length ? (
                  <ResultGroup icon={<Music2 className="h-3.5 w-3.5" />} label="Songs">
                    {results.tracks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          router.push(`/album/${t.albumId}`)
                          setOpen(false)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <img src={t.coverArt} alt="" className="h-8 w-8 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-fg">{t.title}</p>
                          <p className="truncate text-[11px] text-dim">{t.artistName}</p>
                        </div>
                      </button>
                    ))}
                  </ResultGroup>
                ) : null}
                {results?.artists.length ? (
                  <ResultGroup icon={<Users2 className="h-3.5 w-3.5" />} label="Artists">
                    {results.artists.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          router.push(`/artist/${a.id}`)
                          setOpen(false)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <img src={a.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-fg">{a.name}</p>
                          <p className="truncate text-[11px] text-dim">Artist</p>
                        </div>
                      </button>
                    ))}
                  </ResultGroup>
                ) : null}
                {results?.albums.length ? (
                  <ResultGroup icon={<Disc3 className="h-3.5 w-3.5" />} label="Albums">
                    {results.albums.slice(0, 3).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          router.push(`/album/${a.id}`)
                          setOpen(false)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <img src={a.coverArt} alt="" className="h-8 w-8 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-fg">{a.title}</p>
                          <p className="truncate text-[11px] text-dim">{a.artistName}</p>
                        </div>
                      </button>
                    ))}
                  </ResultGroup>
                ) : null}
                {results?.playlists.length ? (
                  <ResultGroup icon={<ListMusic className="h-3.5 w-3.5" />} label="Playlists">
                    {results.playlists.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          router.push(`/playlist/${p.id}`)
                          setOpen(false)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <img src={p.coverArt} alt="" className="h-8 w-8 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-fg">{p.name}</p>
                          <p className="truncate text-[11px] text-dim">Playlist</p>
                        </div>
                      </button>
                    ))}
                  </ResultGroup>
                ) : null}
                <button
                  onClick={submit}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-accent/10 px-3 py-2.5 text-[12.5px] font-medium text-accent-soft transition-colors hover:bg-accent/20"
                >
                  See all results for “{query}”
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/library?tab=liked"
          aria-label="Liked songs"
          className="hidden rounded-full p-2 text-dim transition-colors hover:text-fg sm:block"
        >
          <Heart className="h-[17px] w-[17px]" />
        </Link>
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
          className="hidden rounded-full p-2 text-dim transition-colors hover:text-fg sm:block"
        >
          <Settings className="h-4 w-4" />
        </Link>

        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-indigo-600 text-[11px] font-semibold text-white ring-2 ring-transparent transition-all hover:ring-accent/40"
          >
            {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </button>
          {menuOpen ? (
            <div className="glass-strong hairline absolute right-0 top-[calc(100%+0.6rem)] w-60 overflow-hidden rounded-2xl p-1.5 shadow-float animate-scale-in">
              <div className="px-3 py-2.5">
                <p className="truncate text-[13px] font-medium text-fg">
                  {user?.displayName ?? 'Not signed in'}
                </p>
                <p className="truncate text-[11px] text-dim">{user?.email ?? 'Guest session'}</p>
              </div>
              <div className="my-1 h-px bg-line/[0.07]" />
              <MenuLink href="/library" icon={<Music2 className="h-3.5 w-3.5" />}>
                Your Library
              </MenuLink>
              <MenuLink href="/settings" icon={<Settings className="h-3.5 w-3.5" />}>
                Settings
              </MenuLink>
              <MenuLink href="/about/licensing" icon={<Disc3 className="h-3.5 w-3.5" />}>
                Licences
              </MenuLink>
              {user ? (
                <button
                  onClick={() => {
                    signOut()
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              ) : (
                <MenuLink href="/signin" icon={<LogOut className="h-3.5 w-3.5" />}>
                  Sign in
                </MenuLink>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {current ? (
        <span className="sr-only" aria-live="polite">
          Now playing {current.title} by {current.artistName}
        </span>
      ) : null}
    </header>
  )
}

function ResultGroup({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-1">
      <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
        {icon}
        {label}
      </p>
      {children}
    </div>
  )
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
    >
      <span className="text-dim">{icon}</span>
      {children}
    </Link>
  )
}
