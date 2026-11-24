'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Disc3,
  ListMusic,
  Music2,
  Pause,
  Play,
  Podcast,
  Search,
  Users2,
  X,
} from 'lucide-react'
import { catalog, getTracks, searchCatalog } from '@/lib/catalog-api'
import type { Track } from '@/lib/types'
import { usePlayer } from '@/lib/store/player'
import { useLibrary } from '@/lib/store/library'
import { cn, formatCompact, pluralize } from '@/lib/utils'
import { CoverArt } from '@/components/cards/cover-art'
import { Section, SeeAll, EmptyState } from '@/components/ui/primitives'
import { TrackRow } from '@/components/cards/track-row'
import { AlbumCard, ArtistCard, PlaylistCard } from '@/components/home/home-sections'
import { Carousel } from '@/components/layout/carousel'

const SUGGESTIONS = ['Aarav Rao', 'Noor', 'Midnight Drive', 'Telugu', 'Sufi', 'Dream pop']

const TINTS = [
  'from-violet-600 to-violet-950',
  'from-rose-500 to-rose-950',
  'from-amber-500 to-amber-900',
  'from-teal-500 to-teal-950',
  'from-indigo-600 to-indigo-950',
  'from-fuchsia-600 to-fuchsia-950',
  'from-cyan-500 to-cyan-950',
  'from-emerald-600 to-emerald-950',
  'from-orange-500 to-orange-900',
  'from-sky-500 to-sky-950',
  'from-lime-500 to-lime-900',
  'from-purple-600 to-purple-950',
]

export function SearchView() {
  const router = useRouter()
  const params = useSearchParams()
  const initial = params.get('q') ?? ''
  const [query, setQuery] = useState(initial)
  const [debounced, setDebounced] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)
  const { playQueue, isPlaying, current, pause, resume } = usePlayer()
  const { isLiked, toggleLike } = useLibrary()

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 140)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const onSlash = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onSlash)
    return () => window.removeEventListener('keydown', onSlash)
  }, [])

  const results = useMemo(
    () => (debounced ? searchCatalog(debounced, 8) : null),
    [debounced]
  )

  const hasAny = results && Object.values(results).some((a) => a.length > 0)
  const topResult = useMemo(() => {
    if (!results) return null
    if (results.artists.length) return { kind: 'artist' as const, item: results.artists[0] }
    if (results.tracks.length) return { kind: 'track' as const, item: results.tracks[0] }
    if (results.albums.length) return { kind: 'album' as const, item: results.albums[0] }
    if (results.playlists.length) return { kind: 'playlist' as const, item: results.playlists[0] }
    return null
  }, [results])

  const updateUrl = (q: string) => {
    const url = q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search'
    router.replace(url, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* search box */}
      <div className="relative mx-auto max-w-2xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-dim" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            updateUrl(e.target.value)
          }}
          placeholder="What do you want to listen to?"
          aria-label="Search"
          autoComplete="off"
          spellCheck={false}
          className="h-14 w-full rounded-full border border-line/10 bg-elevated pl-14 pr-14 text-[15px] text-fg outline-none transition-all duration-200 placeholder:text-dim focus:border-accent/50 focus:shadow-glow-sm"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('')
              updateUrl('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-dim transition-colors hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* empty state */}
      {!debounced ? (
        <div className="mt-10">
          <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-dim">
            Try searching for
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s)
                  updateUrl(s)
                }}
                className="rounded-full border border-line/12 bg-elevated px-4 py-2 text-[12.5px] text-muted transition-all hover:border-accent/40 hover:text-fg"
              >
                {s}
              </button>
            ))}
          </div>

          <h2 className="mb-4 mt-12 font-serif text-[1.7rem] text-fg">Browse all</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {catalog.genres.map((g, i) => (
              <Link
                key={g.id}
                href={`/genre/${g.id}`}
                className={cn(
                  'group relative flex aspect-[2] items-end overflow-hidden rounded-xl bg-gradient-to-br p-3.5 transition-transform duration-300 hover:-translate-y-0.5',
                  TINTS[i % TINTS.length]
                )}
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.25),transparent_60%)] opacity-50 transition-opacity group-hover:opacity-90" />
                <span className="relative font-serif text-[1.15rem] text-white">{g.name}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : !hasAny ? (
        <EmptyState
          className="mt-12"
          icon={<Search className="h-6 w-6" />}
          title={`No results for “${debounced}”`}
          description="Check your spelling, or try a song title, artist, album or genre."
          action={
            <button
              onClick={() => {
                setQuery('')
                updateUrl('')
              }}
              className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-soft"
            >
              Clear search
            </button>
          }
        />
      ) : (
        <div className="mt-10 space-y-12">
          {/* top result */}
          {topResult ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div>
                <h2 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-dim">
                  Top result
                </h2>
                <Link
                  href={
                    topResult.kind === 'artist'
                      ? `/artist/${topResult.item.id}`
                      : topResult.kind === 'album'
                        ? `/album/${topResult.item.id}`
                        : topResult.kind === 'playlist'
                          ? `/playlist/${topResult.item.id}`
                          : `/album/${(topResult.item as Track).albumId}`
                  }
                  className="group relative block overflow-hidden rounded-2xl bg-elevated p-5 transition-colors hover:bg-raised"
                >
                  <div className="relative">
                    <CoverArt
                      src={
                        'image' in topResult.item
                          ? (topResult.item as any).image
                          : (topResult.item as any).coverArt
                      }
                      alt=""
                      className={cn(
                        'aspect-square w-full max-w-[9rem]',
                        topResult.kind === 'artist' ? 'rounded-full' : 'rounded-xl'
                      )}
                      rounded={topResult.kind === 'artist' ? 'rounded-full' : 'rounded-xl'}
                    />
                  </div>
                  <h3 className="mt-4 font-serif text-[1.6rem] leading-tight text-fg">
                    {(topResult.item as any).name ?? (topResult.item as any).title}
                  </h3>
                  <p className="mt-1 text-[11.5px] text-dim">
                    {topResult.kind === 'artist'
                      ? `Artist · ${formatCompact((topResult.item as any).monthlyListeners)} listeners`
                      : topResult.kind === 'album'
                        ? 'Album'
                        : topResult.kind === 'playlist'
                          ? 'Playlist'
                          : `Song · ${(topResult.item as any).artistName}`}
                  </p>
                  <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white opacity-0 shadow-glow-sm transition-all duration-200 group-hover:opacity-100">
                    <Play className="h-4 w-4 translate-x-[1px] fill-current" />
                  </span>
                </Link>
              </div>

              {/* songs */}
              <div>
                <h2 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-dim">
                  Songs
                </h2>
                <ul>
                  {results!.tracks.map((t, i) => (
                    <TrackRow key={t.id} track={t} index={i} context={results!.tracks} />
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {/* artists */}
          {results!.artists.length ? (
            <Section title="Artists" action={<SeeAll href="/explore/artists" />}>
              <Carousel>
                {results!.artists.map((a) => (
                  <ArtistCard key={a.id} artist={a} className="w-[8.5rem] sm:w-[9.5rem] lg:w-[10rem]" />
                ))}
              </Carousel>
            </Section>
          ) : null}

          {/* albums */}
          {results!.albums.length ? (
            <Section title="Albums" action={<SeeAll href="/explore/albums" />}>
              <Carousel>
                {results!.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
                ))}
              </Carousel>
            </Section>
          ) : null}

          {/* playlists */}
          {results!.playlists.length ? (
            <Section title="Playlists" action={<SeeAll href="/explore/playlists" />}>
              <Carousel>
                {results!.playlists.map((p) => (
                  <PlaylistCard key={p.id} playlist={p} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
                ))}
              </Carousel>
            </Section>
          ) : null}

          {/* podcasts */}
          {results!.podcasts.length ? (
            <Section title="Podcasts" action={<SeeAll href="/explore/podcasts" />}>
              <Carousel>
                {results!.podcasts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/podcast/${p.id}`}
                    className="block w-[9.5rem] rounded-xl p-2 transition-colors hover:bg-white/[0.045] sm:w-[10.5rem]"
                  >
                    <CoverArt src={p.coverArt} alt="" className="aspect-square w-full rounded-xl" />
                    <p className="mt-2 truncate px-0.5 text-[13px] font-medium text-fg">{p.title}</p>
                    <p className="truncate px-0.5 text-[11.5px] text-dim">{p.host}</p>
                  </Link>
                ))}
              </Carousel>
            </Section>
          ) : null}

          {/* genres */}
          {results!.genres.length ? (
            <Section title="Genres">
              <div className="flex flex-wrap gap-2">
                {results!.genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/genre/${g.id}`}
                    className="rounded-full border border-line/12 bg-elevated px-4 py-2 text-[12.5px] text-muted transition-colors hover:border-accent/40 hover:text-fg"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      )}
    </div>
  )
}
