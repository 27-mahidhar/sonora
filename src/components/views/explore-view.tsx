'use client'

import { catalog, trendingTracks, newReleaseAlbums, featuredArtists } from '@/lib/catalog-api'
import { AlbumCard, ArtistCard, PlaylistCard } from '@/components/home/home-sections'
import { Carousel } from '@/components/layout/carousel'
import { Section, SeeAll, Badge } from '@/components/ui/primitives'
import Link from 'next/link'
import { ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrackRow } from '@/components/cards/track-row'

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

export function ExploreView() {
  const top = trendingTracks.slice(0, 8)

  return (
    <div className="mx-auto max-w-[1600px] space-y-12 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header>
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
          Explore
        </p>
        <h1 className="display text-balance text-[clamp(2.4rem,6vw,4.2rem)] text-fg">
          Find your next obsession
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
          Browse the full catalogue by genre, language and mood — or start with what everyone is
          listening to.
        </p>
      </header>

      {/* quick links */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { href: '/explore/songs', label: 'Songs', icon: '♫' },
          { href: '/explore/albums', label: 'Albums', icon: '▣' },
          { href: '/explore/artists', label: 'Artists', icon: '◉' },
          { href: '/explore/playlists', label: 'Playlists', icon: '≡' },
          { href: '/explore/podcasts', label: 'Podcasts', icon: '◉' },
          { href: '/explore/genres', label: 'Genres', icon: '✦' },
        ].map((q, i) => (
          <Link
            key={q.href}
            href={q.href}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-line/[0.07] bg-elevated p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-line/15',
              'flex flex-col justify-between gap-6'
            )}
          >
            <span className="text-[18px] text-accent-soft">{q.icon}</span>
            <span className="text-[13px] font-medium text-fg">{q.label}</span>
            <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 text-dim opacity-0 transition-all duration-200 group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* genre tiles */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="font-serif text-[1.6rem] leading-none text-fg sm:text-[1.9rem]">
            Browse genres
          </h2>
          <SeeAll href="/explore/genres" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {catalog.genres.map((g, i) => (
            <Link
              key={g.id}
              href={`/genre/${g.id}`}
              className={cn(
                'group relative flex aspect-[1.9] items-end overflow-hidden rounded-xl bg-gradient-to-br p-4',
                'transition-transform duration-300 ease-snap hover:-translate-y-0.5',
                TINTS[i % TINTS.length]
              )}
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.25),transparent_60%)] opacity-50 transition-opacity duration-300 group-hover:opacity-90" />
              <div className="relative">
                <p className="font-serif text-[1.25rem] leading-none text-white">{g.name}</p>
                <p className="mt-1 text-[10.5px] text-white/60">{g.trackIds.length} songs</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* trending */}
      <Section
        title={
          <span className="flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-accent-soft" />
            Trending now
          </span>
        }
        action={<SeeAll href="/explore/trending" />}
      >
        <ul>
          {top.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} context={trendingTracks.slice(0, 50)} />
          ))}
        </ul>
      </Section>

      {/* new releases */}
      <Section
        title={
          <span className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-accent-soft" />
            New releases
          </span>
        }
        action={<SeeAll href="/explore/new-releases" />}
      >
        <Carousel>
          {newReleaseAlbums.slice(0, 14).map((a) => (
            <AlbumCard key={a.id} album={a} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
          ))}
        </Carousel>
      </Section>

      {/* artists */}
      <Section title="Artists to follow" action={<SeeAll href="/explore/artists" />}>
        <Carousel>
          {featuredArtists.map((a) => (
            <ArtistCard key={a.id} artist={a} className="w-[8.5rem] sm:w-[9.5rem] lg:w-[10rem]" />
          ))}
        </Carousel>
      </Section>

      {/* playlists */}
      <Section title="Popular playlists" action={<SeeAll href="/explore/playlists" />}>
        <Carousel>
          {catalog.playlists
            .filter((p) => !p.id.startsWith('daily-mix'))
            .slice(0, 14)
            .map((p) => (
              <PlaylistCard key={p.id} playlist={p} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
            ))}
        </Carousel>
      </Section>
    </div>
  )
}
