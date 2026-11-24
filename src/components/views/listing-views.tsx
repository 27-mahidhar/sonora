'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Podcast as PodcastIcon } from 'lucide-react'
import type { Album, Artist, Genre, Playlist, Podcast, Track } from '@/lib/types'
import {
  catalog,
  getTracks,
  newReleaseAlbums,
  trendingTracks,
} from '@/lib/catalog-api'
import { CollectionPage, type FilterGroup, type SortOption } from './collection-page'
import { TrackRow } from '@/components/cards/track-row'
import { AlbumCard, ArtistCard, PlaylistCard } from '@/components/home/home-sections'
import { CoverArt } from '@/components/cards/cover-art'
import { cn, formatCompact, pluralize } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Shared filter definitions                                           */
/* ------------------------------------------------------------------ */
const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Tamil'].map((l) => ({ id: l, label: l }))
const GENRES = catalog.genres.map((g) => ({ id: g.id, label: g.name }))

/* ------------------------------------------------------------------ */
/* Songs                                                               */
/* ------------------------------------------------------------------ */
export function SongsListing() {
  const tracks = useMemo(() => [...catalog.tracks].sort((a, b) => b.plays - a.plays), [])

  const filters: FilterGroup<Track>[] = [
    { id: 'language', label: 'Language', options: LANGUAGES, predicate: (t, v) => t.language === v },
    { id: 'genre', label: 'Genre', options: GENRES, predicate: (t, v) => t.genre === v },
  ]

  const sortOptions: SortOption<Track>[] = [
    { id: 'popular', label: 'Most played', compare: (a, b) => b.plays - a.plays },
    { id: 'az', label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
    { id: 'short', label: 'Shortest', compare: (a, b) => a.duration - b.duration },
    { id: 'long', label: 'Longest', compare: (a, b) => b.duration - a.duration },
    { id: 'new', label: 'Newest', compare: (a, b) => b.year - a.year },
  ]

  return (
    <CollectionPage<Track>
      eyebrow="Catalogue"
      title="Songs"
      description="Every track on SONORA — filter by language, genre or length."
      items={tracks}
      filters={filters}
      sortOptions={sortOptions}
      searchPredicate={(t, q) =>
        `${t.title} ${t.artistName} ${t.albumTitle}`.toLowerCase().includes(q)
      }
      searchPlaceholder="Filter songs, artists, albums"
      layout="list"
      renderItem={(t, i) => (
        <li key={t.id}>
          <TrackRow track={t} index={i} context={tracks} />
        </li>
      )}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Albums                                                              */
/* ------------------------------------------------------------------ */
export function AlbumsListing() {
  const albums = useMemo(
    () => [...catalog.albums].sort((a, b) => b.plays - a.plays),
    []
  )
  const filters: FilterGroup<Album>[] = [
    { id: 'language', label: 'Language', options: LANGUAGES, predicate: (a, v) => a.language === v },
    {
      id: 'type',
      label: 'Type',
      options: [
        { id: 'album', label: 'Album' },
        { id: 'ep', label: 'EP' },
        { id: 'single', label: 'Single' },
        { id: 'mixtape', label: 'Mixtape' },
      ],
      predicate: (a, v) => a.type === v,
    },
  ]
  const sortOptions: SortOption<Album>[] = [
    { id: 'popular', label: 'Most played', compare: (a, b) => b.plays - a.plays },
    { id: 'az', label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
    { id: 'new', label: 'Newest', compare: (a, b) => b.year - a.year },
  ]

  return (
    <CollectionPage<Album>
      eyebrow="Catalogue"
      title="Albums"
      description="Studio albums, EPs, singles and mixtapes."
      items={albums}
      filters={filters}
      sortOptions={sortOptions}
      searchPredicate={(a, q) => `${a.title} ${a.artistName}`.toLowerCase().includes(q)}
      searchPlaceholder="Filter albums"
      renderItem={(a) => <AlbumCard key={a.id} album={a} />}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Artists                                                             */
/* ------------------------------------------------------------------ */
export function ArtistsListing() {
  const artists = useMemo(
    () => [...catalog.artists].sort((a, b) => b.monthlyListeners - a.monthlyListeners),
    []
  )
  const filters: FilterGroup<Artist>[] = [
    { id: 'language', label: 'Language', options: LANGUAGES, predicate: (a, v) => a.language === v },
    { id: 'genre', label: 'Genre', options: GENRES, predicate: (a, v) => a.genre === v },
  ]
  const sortOptions: SortOption<Artist>[] = [
    { id: 'listeners', label: 'Most listeners', compare: (a, b) => b.monthlyListeners - a.monthlyListeners },
    { id: 'az', label: 'Name A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
    { id: 'old', label: 'Debut year', compare: (a, b) => a.debutYear - b.debutYear },
  ]

  return (
    <CollectionPage<Artist>
      eyebrow="Catalogue"
      title="Artists"
      description="The people making the music — from playback legends to bedroom producers."
      items={artists}
      filters={filters}
      sortOptions={sortOptions}
      searchPredicate={(a, q) => `${a.name} ${a.genres.join(' ')}`.toLowerCase().includes(q)}
      searchPlaceholder="Filter artists"
      renderItem={(a) => <ArtistCard key={a.id} artist={a} />}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Playlists                                                           */
/* ------------------------------------------------------------------ */
export function PlaylistsListing() {
  const playlists = useMemo(() => catalog.playlists, [])
  return (
    <CollectionPage<Playlist>
      eyebrow="Curated"
      title="Playlists"
      description="Editorial and algorithmic playlists, refreshed every week."
      items={playlists}
      filters={[
        {
          id: 'mood',
          label: 'Mood',
          options: [
            { id: 'chill', label: 'Chill' },
            { id: 'energetic', label: 'Energetic' },
            { id: 'romantic', label: 'Romantic' },
            { id: 'focus', label: 'Focus' },
            { id: 'party', label: 'Party' },
            { id: 'nostalgic', label: 'Nostalgic' },
          ],
          predicate: (p, v) => p.mood === v,
        },
      ]}
      sortOptions={[
        { id: 'az', label: 'Name A–Z', compare: (a, b) => a.name.localeCompare(b.name) },
        { id: 'followers', label: 'Most saved', compare: (a, b) => b.followers - a.followers },
      ]}
      searchPredicate={(p, q) => `${p.name} ${p.description}`.toLowerCase().includes(q)}
      searchPlaceholder="Filter playlists"
      renderItem={(p) => <PlaylistCard key={p.id} playlist={p} />}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Genres                                                              */
/* ------------------------------------------------------------------ */
export function GenresListing() {
  const genres = useMemo(() => catalog.genres, [])
  return (
    <CollectionPage<Genre>
      eyebrow="Browse"
      title="Genres"
      description="Twelve ways into the catalogue. Pick a mood and go."
      items={genres}
      hideSearch
      renderItem={(g, i) => <GenreTile key={g.id} genre={g} index={i} />}
    />
  )
}

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

function GenreTile({ genre, index }: { genre: Genre; index: number }) {
  return (
    <Link
      href={`/genre/${genre.id}`}
      className={cn(
        'group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br p-4',
        'transition-transform duration-300 ease-snap hover:-translate-y-0.5',
        TINTS[index % TINTS.length]
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.28),transparent_58%)] opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <p className="font-serif text-[1.4rem] leading-none text-white">{genre.name}</p>
        <p className="mt-1.5 text-[10.5px] text-white/60">
          {pluralize(genre.trackIds.length, 'song')}
        </p>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Podcasts                                                            */
/* ------------------------------------------------------------------ */
export function PodcastsListing() {
  const podcasts = useMemo(() => catalog.podcasts, [])
  return (
    <CollectionPage<Podcast>
      eyebrow="Listen"
      title="Podcasts"
      description="Conversations about music, craft and the people who make it."
      items={podcasts}
      sortOptions={[
        { id: 'az', label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
        { id: 'ep', label: 'Most episodes', compare: (a, b) => b.episodes.length - a.episodes.length },
      ]}
      searchPredicate={(p, q) => `${p.title} ${p.host} ${p.genre}`.toLowerCase().includes(q)}
      searchPlaceholder="Filter podcasts"
      renderItem={(p) => <PodcastCard key={p.id} podcast={p} />}
    />
  )
}

function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link
      href={`/podcast/${podcast.id}`}
      className="group/card block rounded-xl p-2 transition-colors hover:bg-white/[0.045]"
    >
      <div className="relative">
        <CoverArt src={podcast.coverArt} alt={`${podcast.title} cover`} className="aspect-square w-full" />
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
          <PodcastIcon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="truncate text-[13px] font-medium text-fg">{podcast.title}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-dim">{podcast.host}</p>
        <p className="mt-1 truncate text-[10.5px] text-dim/70">
          {pluralize(podcast.episodes.length, 'episode')} · {formatCompact(podcast.followers)} followers
        </p>
      </div>
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* New releases                                                        */
/* ------------------------------------------------------------------ */
export function NewReleasesListing() {
  const albums = useMemo(() => newReleaseAlbums, [])
  return (
    <CollectionPage<Album>
      eyebrow="Fresh"
      title="New releases"
      description="The latest albums, EPs and singles — newest first."
      items={albums}
      filters={[
        { id: 'language', label: 'Language', options: LANGUAGES, predicate: (a, v) => a.language === v },
      ]}
      sortOptions={[
        { id: 'new', label: 'Newest', compare: (a, b) => b.year - a.year },
        { id: 'popular', label: 'Most played', compare: (a, b) => b.plays - a.plays },
        { id: 'az', label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
      ]}
      searchPredicate={(a, q) => `${a.title} ${a.artistName}`.toLowerCase().includes(q)}
      searchPlaceholder="Filter releases"
      renderItem={(a) => <AlbumCard key={a.id} album={a} />}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Trending                                                            */
/* ------------------------------------------------------------------ */
export function TrendingListing() {
  const tracks = useMemo(() => trendingTracks, [])
  return (
    <CollectionPage<Track>
      eyebrow="Charts"
      title="Trending"
      description="The most-played tracks on SONORA, updated daily."
      items={tracks}
      filters={[
        { id: 'language', label: 'Language', options: LANGUAGES, predicate: (t, v) => t.language === v },
      ]}
      searchPlaceholder="Search the chart"
      searchPredicate={(t, q) =>
        t.title.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q)
      }
      layout="list"
      renderItem={(t, i) => (
        <li key={t.id}>
          <TrackRow track={t} index={i} context={tracks} />
        </li>
      )}
    />
  )
}
