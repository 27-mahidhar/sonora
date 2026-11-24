'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Clock,
  Heart,
  Pause,
  Play,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { Album, Artist, Playlist, Track } from '@/lib/types'
import {
  catalog,
  featuredArtists,
  getAlbum,
  getTracks,
  newReleases,
  trendingTracks,
} from '@/lib/catalog-api'
import { useLibrary } from '@/lib/store/library'
import { usePlayer } from '@/lib/store/player'
import { useAuth } from '@/lib/store/auth'
import { useToast } from '@/lib/store/toast'
import { cn, formatDuration, pluralize } from '@/lib/utils'
import { MediaCard } from '@/components/cards/media-card'
import { CoverArt } from '@/components/cards/cover-art'
import { Carousel } from '@/components/layout/carousel'
import { Section, SeeAll, Badge } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */
const FEATURED_ID = 'noor'

export function HeroBanner() {
  const album = getAlbum(FEATURED_ID) ?? newReleases[0]
  const { playQueue, isPlaying, toggle, current, pause, resume } = usePlayer()
  const { isAlbumSaved, toggleSaveAlbum } = useLibrary()
  const tracks = useMemo(() => getTracks(album.trackIds), [album.trackIds])
  const isCurrentAlbum = !!current && tracks.some((t) => t.id === current.id)
  const playing = isCurrentAlbum && isPlaying
  const saved = isAlbumSaved(album.id)

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line/[0.06] bg-elevated">
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={album.coverArt}
          alt=""
          className="h-full w-full scale-110 object-cover opacity-70 blur-[60px] saturate-150 dark:opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-base via-base/90 to-base/30 dark:via-base/85 dark:to-base/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-base/70 via-transparent to-transparent" />
        <div className="absolute inset-0 grain" />
      </div>

      <div className="relative grid items-center gap-6 p-5 sm:gap-8 sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)] lg:gap-12 lg:p-12">
        <div className="min-w-0">
          <div className="mb-5 flex items-center gap-2">
            <Badge variant="accent">Featured album</Badge>
            {album.year >= 2024 ? <Badge variant="outline">New</Badge> : null}
          </div>
          <h1 className="display text-balance text-[clamp(2.2rem,9vw,5rem)] text-fg">
            {album.title}
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-muted">
            <Link
              href={`/artist/${album.artistId}`}
              className="font-medium text-fg/90 underline-offset-4 hover:text-accent-soft hover:underline"
            >
              {album.artistName}
            </Link>
            <span className="text-dim">·</span>
            <span>{album.year}</span>
            <span className="text-dim">·</span>
            <span>{pluralize(album.trackCount, 'song')}</span>
            <span className="text-dim">·</span>
            <span className="text-fg/70">{Math.round(album.plays / 1_000_000)}M plays</span>
          </p>
          <p className="mt-3 line-clamp-3 max-w-lg text-[13.5px] leading-relaxed text-muted/90 sm:mt-4 sm:line-clamp-none">
            {album.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:mt-7 sm:gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                playing ? pause() : isCurrentAlbum ? resume() : playQueue(tracks, 0)
              }
              aria-label={playing ? `Pause ${album.title}` : `Play ${album.title}`}
              className="rounded-full px-7"
            >
              {playing ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px] fill-current" />
              )}
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => toggleSaveAlbum(album.id)}
              className="rounded-full"
            >
              <Heart className={cn('h-4 w-4', saved && 'fill-current text-accent-soft')} />
              {saved ? 'Saved' : 'Save'}
            </Button>
            <Link
              href={`/album/${album.id}`}
              className="group/link inline-flex items-center gap-1.5 px-2 text-[13px] font-medium text-muted transition-colors hover:text-fg"
            >
              View album
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-[13.5rem] sm:w-full sm:max-w-[300px] lg:max-w-[380px]">
          <div className="art art-shadow grain relative aspect-square overflow-hidden rounded-2xl">
            <img src={album.coverArt} alt={`${album.title} cover`} className="h-full w-full object-cover" />
            <div className="sheen absolute inset-0 opacity-50" />
          </div>
          <div
            aria-hidden="true"
            className="absolute -inset-4 -z-10 rounded-3xl bg-accent/30 blur-[60px]"
          />
          {/* track peek */}
          <div className="absolute -bottom-3 -right-3 hidden rounded-2xl border border-line/10 bg-base/85 px-4 py-3 backdrop-blur-xl sm:block">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-dim">
              Top track
            </p>
            <p className="mt-0.5 max-w-[11rem] truncate text-[12.5px] font-medium text-fg">
              {tracks[0]?.title ?? '—'}
            </p>
            <p className="text-[11px] text-dim">{formatDuration(tracks[0]?.duration ?? 0)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Greeting + quick picks                                              */
/* ------------------------------------------------------------------ */
export function Greeting() {
  const { user } = useAuth()
  const [hour, setHour] = useState<number | null>(null)

  useEffect(() => {
    setHour(new Date().getHours())
  }, [])

  const label =
    hour === null ? '' : hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="display text-balance text-[clamp(1.9rem,4.5vw,3rem)] text-fg">
        {label}
        {user?.displayName ? (
          <span className="text-dim">, {user.displayName.split(' ')[0]}</span>
        ) : null}
      </h2>
      <p className="hidden text-[12px] text-dim sm:block">
        {new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>
    </div>
  )
}

export function QuickPicks() {
  const { likedTracks, recentlyPlayed, userPlaylists } = useLibrary()
  const { playQueue, playTrack, isPlaying, current, toggle } = usePlayer()

  const items = useMemo(() => {
    const out: Array<{
      href: string
      title: string
      subtitle: string
      cover: string
      tracks?: Track[]
      circle?: boolean
      icon?: React.ReactNode
    }> = []

    if (likedTracks.length) {
      out.push({
        href: '/library?tab=liked',
        title: 'Liked Songs',
        subtitle: `${likedTracks.length} songs`,
        cover: likedTracks[0]?.coverArt ?? '',
        tracks: likedTracks,
        icon: <Heart className="h-4 w-4" />,
      })
    }
    if (recentlyPlayed.length) {
      out.push({
        href: '/library?tab=recent',
        title: 'Recently Played',
        subtitle: 'Pick up where you left off',
        cover: recentlyPlayed[0]?.coverArt ?? '',
        tracks: recentlyPlayed,
        icon: <Clock className="h-4 w-4" />,
      })
    }
    const mixes = catalog.playlists.filter((p) => p.id.startsWith('daily-mix') || p.id === 'discover-weekly')
    for (const m of mixes.slice(0, 4)) {
      out.push({
        href: `/playlist/${m.id}`,
        title: m.name,
        subtitle: m.description,
        cover: m.coverArt,
        tracks: getTracks(m.trackIds),
      })
    }
    for (const p of userPlaylists.slice(0, 3)) {
      out.push({
        href: `/playlist/${p.id}`,
        title: p.name,
        subtitle: `${p.trackIds.length} songs`,
        cover: getTracks(p.trackIds)[0]?.coverArt ?? '',
        tracks: getTracks(p.trackIds),
      })
    }
    return out.slice(0, 8)
  }, [likedTracks, recentlyPlayed, userPlaylists])

  if (!items.length) return null

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const isCurrent = !!current && item.tracks?.some((t) => t.id === current.id)
        const playing = isCurrent && isPlaying
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group/pick relative flex items-center gap-3 overflow-hidden rounded-xl bg-elevated pr-3 transition-colors duration-200 hover:bg-raised"
          >
            <div className="art h-14 w-14 shrink-0 overflow-hidden rounded-l-xl sm:h-16 sm:w-16">
              {item.cover ? (
                <img src={item.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/20 text-accent-soft">
                  {item.icon}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-fg">{item.title}</p>
              <p className="truncate text-[11px] text-dim">{item.subtitle}</p>
            </div>
            {item.tracks?.length ? (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  isCurrent ? toggle() : playQueue(item.tracks!, 0)
                }}
                aria-label={playing ? `Pause ${item.title}` : `Play ${item.title}`}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-glow-sm transition-all duration-200',
                  playing
                    ? 'scale-100 opacity-100'
                    : 'scale-90 opacity-0 group-hover/pick:scale-100 group-hover/pick:opacity-100'
                )}
              >
                {playing ? (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 translate-x-[1px] fill-current" />
                )}
              </button>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Section helpers                                                     */
/* ------------------------------------------------------------------ */
export function MadeForYou() {
  const mixes = catalog.playlists.filter(
    (p) => p.id.startsWith('daily-mix') || p.id === 'discover-weekly' || p.id === 'on-repeat'
  )
  return (
    <Section
      title="Made for You"
      description="Playlists built from what you listen to, refreshed every week."
      action={<SeeAll href="/explore/playlists" />}
    >
      <Carousel>
        {mixes.map((p) => (
          <PlaylistCard key={p.id} playlist={p} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
        ))}
      </Carousel>
    </Section>
  )
}

export function PlaylistCard({ playlist, className }: { playlist: Playlist; className?: string }) {
  return (
    <MediaCard
      href={`/playlist/${playlist.id}`}
      title={playlist.name}
      subtitle={playlist.curator}
      cover={playlist.coverArt}
      playTracks={getTracks(playlist.trackIds)}
      className={className}
    />
  )
}

export function AlbumCard({ album, className }: { album: Album; className?: string }) {
  return (
    <MediaCard
      href={`/album/${album.id}`}
      title={album.title}
      subtitle={album.artistName}
      cover={album.coverArt}
      playTracks={getTracks(album.trackIds)}
      meta={`${album.year} · ${album.type === 'ep' ? 'EP' : album.type === 'single' ? 'Single' : 'Album'}`}
      className={className}
    />
  )
}

export function ArtistCard({ artist, className }: { artist: Artist; className?: string }) {
  const { isFollowing } = useLibrary()
  return (
    <MediaCard
      href={`/artist/${artist.id}`}
      title={artist.name}
      subtitle={isFollowing(artist.id) ? 'Following' : artist.genres[0]}
      cover={artist.image}
      variant="circle"
      showPlay={false}
      className={className}
    />
  )
}

export function TrendingWorldwide() {
  const top = trendingTracks.slice(0, 10)
  return (
    <Section
      title={
        <span className="flex items-center gap-2.5">
          <TrendingUp className="h-6 w-6 text-accent-soft" />
          Trending worldwide
        </span>
      }
      description="The most-played tracks on SONORA right now."
      action={<SeeAll href="/explore/trending" />}
    >
      <div className="grid gap-x-8 lg:grid-cols-2">
        {top.map((t, i) => (
          <TrendingRow key={t.id} track={t} rank={i + 1} context={top} />
        ))}
      </div>
    </Section>
  )
}

function TrendingRow({ track, rank, context }: { track: Track; rank: number; context: Track[] }) {
  const { playQueue, isPlaying, current, toggle, pause, resume } = usePlayer()
  const { isLiked, toggleLike } = useLibrary()
  const { toast } = useToast()
  const isCurrent = current?.id === track.id
  const playing = isCurrent && isPlaying

  return (
    <div
      className={cn(
        'group/trend flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.05]',
        isCurrent && 'bg-white/[0.06]'
      )}
    >
      <span
        className={cn(
          'w-6 shrink-0 text-center font-serif text-lg tabular-nums',
          rank <= 3 ? 'text-accent-soft' : 'text-dim'
        )}
      >
        {rank}
      </span>
      <button
        onClick={() => (playing ? pause() : isCurrent ? resume() : playQueue(context, rank - 1))}
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        <img src={track.coverArt} alt="" loading="lazy" className="h-full w-full object-cover" />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/55 text-white transition-opacity',
            playing ? 'opacity-100' : 'opacity-0 group-hover/trend:opacity-100'
          )}
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-[13px] font-medium', isCurrent ? 'text-accent-soft' : 'text-fg')}>
          {track.title}
        </p>
        <p className="truncate text-[11.5px] text-dim">{track.artistName}</p>
      </div>
      <span className="hidden text-[11px] text-dim sm:block">{track.language}</span>
      <button
        onClick={() => {
          toggleLike(track.id)
          toast(isLiked(track.id) ? 'Removed from Liked Songs' : 'Added to Liked Songs', track.title, 'music')
        }}
        aria-label={isLiked(track.id) ? 'Unlike' : 'Like'}
        className={cn(
          'hidden rounded-full p-1.5 transition-colors sm:block',
          isLiked(track.id) ? 'text-accent-soft' : 'text-dim hover:text-fg'
        )}
      >
        <Heart className={cn('h-3.5 w-3.5', isLiked(track.id) && 'fill-current')} />
      </button>
      <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-dim">
        {formatDuration(track.duration)}
      </span>
    </div>
  )
}



/* ------------------------------------------------------------------ */
/* Language sections                                                   */
/* ------------------------------------------------------------------ */
const LANGUAGE_META: Array<{ language: string; blurb: string }> = [
  { language: 'Telugu', blurb: 'The sound of Andhra and Telangana, right now.' },
  { language: 'Hindi', blurb: 'Bollywood, indie and everything in between.' },
  { language: 'English', blurb: 'Global pop, alt and R&B, hand-picked.' },
  { language: 'Tamil', blurb: 'Kollywood to Coimbatore — the best of Tamil music.' },
]

export function LanguageGrid() {
  return (
    <div className="grid gap-x-8 gap-y-10 xl:grid-cols-2">
      {LANGUAGE_META.map(({ language, blurb }) => (
        <LanguageSection key={language} language={language} blurb={blurb} />
      ))}
    </div>
  )
}

function LanguageSection({ language, blurb }: { language: string; blurb: string }) {
  const tracks = useMemo(
    () => [...catalog.tracks].filter((t) => t.language === language).slice(0, 5),
    [language]
  )
  return (
    <div>
      <header className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h3 className="font-serif text-[1.5rem] leading-none text-fg sm:text-[1.75rem]">
            Top {language} hits
          </h3>
          <p className="mt-1 text-[12px] text-dim">{blurb}</p>
        </div>
        <SeeAll href={`/explore/songs?language=${language.toLowerCase()}`} />
      </header>
      <ul className="space-y-0.5">
        {tracks.map((t, i) => (
          <CompactTrack key={t.id} track={t} index={i} context={tracks} />
        ))}
      </ul>
    </div>
  )
}

function CompactTrack({ track, index, context }: { track: Track; index: number; context: Track[] }) {
  const { playQueue, isPlaying, current, toggle, pause, resume } = usePlayer()
  const { isLiked, toggleLike } = useLibrary()
  const { toast } = useToast()
  const isCurrent = current?.id === track.id
  const playing = isCurrent && isPlaying

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={() => (playing ? pause() : isCurrent ? resume() : playQueue(context, index))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            isCurrent ? toggle() : playQueue(context, index)
          }
        }}
        className={cn(
          'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]',
          isCurrent && 'bg-white/[0.06]'
        )}
      >
        <span className={cn('w-4 shrink-0 text-right font-mono text-[11px] tabular-nums', isCurrent ? 'text-accent-soft' : 'text-dim')}>
          {index + 1}
        </span>
        <div className="art h-9 w-9 shrink-0 overflow-hidden rounded-md">
          <img src={track.coverArt} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[12.5px] font-medium', isCurrent ? 'text-accent-soft' : 'text-fg')}>
            {track.title}
          </p>
          <p className="truncate text-[11px] text-dim">{track.artistName}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleLike(track.id)
            toast(isLiked(track.id) ? 'Removed from Liked Songs' : 'Added to Liked Songs', track.title, 'music')
          }}
          aria-label={isLiked(track.id) ? 'Unlike' : 'Like'}
          className={cn(
            'hidden rounded-full p-1.5 transition-colors sm:block',
            isLiked(track.id) ? 'text-accent-soft' : 'text-dim opacity-0 hover:text-fg group-hover:opacity-100'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', isLiked(track.id) && 'fill-current')} />
        </button>
        <span className="w-9 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-dim">
          {formatDuration(track.duration)}
        </span>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* New releases / artists / playlists                                  */
/* ------------------------------------------------------------------ */
export function NewReleasesSection() {
  const albums = newReleases.slice(0, 12)
  return (
    <Section
      title={
        <span className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-accent-soft" />
          New releases
        </span>
      }
      description="Fresh albums, EPs and singles from the artists you follow."
      action={<SeeAll href="/explore/new-releases" />}
    >
      <Carousel>
        {albums.map((a) => (
          <AlbumCard key={a.id} album={a} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11.5rem]" />
        ))}
      </Carousel>
    </Section>
  )
}

export function RecommendedArtistsSection() {
  const artists = featuredArtists.slice(0, 12)
  return (
    <Section
      title="Recommended artists"
      description="People you should probably be listening to."
      action={<SeeAll href="/explore/artists" />}
    >
      <Carousel>
        {artists.map((a) => (
          <ArtistCard key={a.id} artist={a} className="w-[8.5rem] sm:w-[9.5rem] lg:w-[10rem]" />
        ))}
      </Carousel>
    </Section>
  )
}

export function PopularPlaylistsSection() {
  const playlists = catalog.playlists
    .filter((p) => !p.id.startsWith('daily-mix'))
    .slice(0, 14)
  return (
    <Section
      title="Popular playlists"
      description="Curated by SONORA editors, updated weekly."
      action={<SeeAll href="/explore/playlists" />}
    >
      <Carousel>
        {playlists.map((p) => (
          <PlaylistCard key={p.id} playlist={p} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
        ))}
      </Carousel>
    </Section>
  )
}
