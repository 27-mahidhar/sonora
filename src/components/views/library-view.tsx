'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Clock,
  Heart,
  ListMusic,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Users2,
  Disc3,
  X,
} from 'lucide-react'
import type { Album, Artist, Playlist, Track, UserPlaylist } from '@/lib/types'
import { getTracks, getAlbum, getArtist } from '@/lib/catalog-api'
import { useLibrary } from '@/lib/store/library'
import { usePlayer } from '@/lib/store/player'
import { useToast } from '@/lib/store/toast'
import { useAuth } from '@/lib/store/auth'
import { cn, formatDuration, pluralize } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Modal, ConfirmDialog } from '@/components/ui/modal'
import { EmptyState, Skeleton, Section, SeeAll } from '@/components/ui/primitives'
import { MediaCard } from '@/components/cards/media-card'
import { CoverArt } from '@/components/cards/cover-art'
import { TrackRow } from '@/components/cards/track-row'
import { Carousel } from '@/components/layout/carousel'
import { AlbumCard, ArtistCard } from '@/components/home/home-sections'

type Tab = 'playlists' | 'artists' | 'albums' | 'liked' | 'recent'

const TABS: { id: Tab; label: string }[] = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'artists', label: 'Artists' },
  { id: 'albums', label: 'Albums' },
  { id: 'liked', label: 'Liked Songs' },
  { id: 'recent', label: 'Recently Played' },
]

export function LibraryView() {
  const router = useRouter()
  const params = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'playlists'

  const {
    likedTracks,
    followedArtists,
    savedAlbums,
    savedSystemPlaylists,
    userPlaylists,
    recentlyPlayed,
    ready,
    createPlaylist,
    deletePlaylist,
  } = useLibrary()
  const { playQueue, isPlaying, current, pause, resume } = usePlayer()
  const { toast } = useToast()
  const { user } = useAuth()

  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserPlaylist | null>(null)

  const q = query.trim().toLowerCase()
  const filterFn = (text: string) => !q || text.toLowerCase().includes(q)

  const playlists = useMemo(
    () =>
      [...userPlaylists, ...savedSystemPlaylists].filter((p) => filterFn(p.name)),
    [userPlaylists, savedSystemPlaylists, q]
  )
  const artists = useMemo(
    () => followedArtists.filter((a) => filterFn(a.name)),
    [followedArtists, q]
  )
  const albums = useMemo(
    () => savedAlbums.filter((a) => filterFn(a.title)),
    [savedAlbums, q]
  )

  const likedIsCurrent = !!current && likedTracks.some((t) => t.id === current.id)
  const playingLiked = likedIsCurrent && isPlaying

  const totalLiked = likedTracks.reduce((s, t) => s + t.duration, 0)

  const counts: Record<Tab, number> = {
    playlists: playlists.length,
    artists: artists.length,
    albums: albums.length,
    liked: likedTracks.length,
    recent: recentlyPlayed.length,
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
            Your Library
          </p>
          <h1 className="display text-[clamp(2.2rem,5.5vw,3.8rem)] text-fg">
            {user ? `${user.displayName.split(' ')[0]}\u2019s library` : 'Your library'}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {pluralize(likedTracks.length, 'liked song')} · {pluralize(followedArtists.length, 'artist')} ·{' '}
            {pluralize(savedAlbums.length, 'album')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search library"
              aria-label="Search library"
              className="h-10 w-52 rounded-full border border-line/10 bg-elevated pl-10 pr-9 text-[13px] text-fg outline-none transition-colors placeholder:text-dim focus:border-accent/45"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-dim hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)} className="rounded-full">
            <Plus className="h-4 w-4" />
            New playlist
          </Button>
        </div>
      </header>

      {/* tabs */}
      <nav
        aria-label="Library sections"
        className="no-scrollbar sticky top-16 z-20 -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-line/[0.07] bg-base/85 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => router.replace(`/library?tab=${t.id}`, { scroll: false })}
            aria-current={tab === t.id ? 'page' : undefined}
            className={cn(
              'relative shrink-0 rounded-full px-4 py-2 text-[12.5px] font-medium transition-colors',
              tab === t.id ? 'bg-white/[0.09] text-fg' : 'text-dim hover:text-muted'
            )}
          >
            {t.label}
            <span
              className={cn(
                'ml-1.5 text-[10.5px] tabular-nums',
                tab === t.id ? 'text-accent-soft' : 'text-dim/60'
              )}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {!ready ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="p-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="mt-3 h-3 w-4/5" />
                <Skeleton className="mt-2 h-2.5 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'playlists' ? (
              <PlaylistsTab
                playlists={playlists}
                onCreate={() => setCreateOpen(true)}
                onDelete={setDeleteTarget}
              />
            ) : null}
            {tab === 'artists' ? (
              artists.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {artists.map((a) => (
                    <ArtistCard key={a.id} artist={a} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Users2 className="h-6 w-6" />}
                  title="No artists followed yet"
                  description="Follow artists to see them here and get better recommendations."
                  action={
                    <Link
                      href="/explore/artists"
                      className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white"
                    >
                      Browse artists
                    </Link>
                  }
                />
              )
            ) : null}
            {tab === 'albums' ? (
              albums.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {albums.map((a) => (
                    <AlbumCard key={a.id} album={a} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Disc3 className="h-6 w-6" />}
                  title="No saved albums yet"
                  description="Save albums you love and they’ll live here, ready to play."
                  action={
                    <Link
                      href="/explore/albums"
                      className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white"
                    >
                      Browse albums
                    </Link>
                  }
                />
              )
            ) : null}
            {tab === 'liked' ? (
              <LikedTab
                tracks={likedTracks}
                playing={playingLiked}
                isCurrent={likedIsCurrent}
                onPause={() => pause()}
                onResume={() => resume()}
                onPlay={() => playQueue(likedTracks, 0)}
                total={totalLiked}
              />
            ) : null}
            {tab === 'recent' ? (
              <RecentTab tracks={recentlyPlayed} />
            ) : null}
          </>
        )}
      </div>

      {/* create playlist */}
      <CreatePlaylistModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(name, description) => {
          const p = createPlaylist(name, description)
          setCreateOpen(false)
          toast('Playlist created', p.name, 'success')
          router.push(`/playlist/${p.id}`)
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deletePlaylist(deleteTarget.id)
            toast('Playlist deleted', deleteTarget.name, 'info')
          }
          setDeleteTarget(null)
        }}
        title={`Delete “${deleteTarget?.name ?? ''}”?`}
        description="This can’t be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */
function PlaylistsTab({
  playlists,
  onCreate,
  onDelete,
}: {
  playlists: Array<UserPlaylist | Playlist>
  onCreate: () => void
  onDelete: (p: UserPlaylist) => void
}) {
  const { savedSystemPlaylists } = useLibrary()

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <button
          onClick={onCreate}
          className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line/15 bg-elevated/50 p-6 transition-all hover:border-accent/40 hover:bg-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent-soft transition-transform group-hover:scale-105">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-[12.5px] font-medium text-muted group-hover:text-fg">
            New playlist
          </span>
        </button>

        {playlists.map((p) => {
          const owned = !('system' in p)
          const cover =
            getTracks(p.trackIds)[0]?.coverArt ??
            ('coverArt' in p ? p.coverArt : undefined) ??
            '/art/gen/cover-noor.svg'
          const isCurrent = false
          return (
            <div key={p.id} className="group/pl relative">
              <MediaCard
                href={`/playlist/${p.id}`}
                title={p.name}
                subtitle={
                  owned
                    ? `${p.trackIds.length} ${p.trackIds.length === 1 ? 'song' : 'songs'} · You`
                    : `${'curator' in p ? p.curator : 'SONORA'} · ${p.trackIds.length} songs`
                }
                cover={cover}
                playTracks={getTracks(p.trackIds)}
              />
              {owned ? (
                <button
                  onClick={() => onDelete(p as UserPlaylist)}
                  aria-label={`Delete ${p.name}`}
                  className="absolute right-1 top-1 z-10 rounded-full bg-black/50 p-1.5 text-white/70 opacity-0 backdrop-blur transition-all hover:text-white group-hover/pl:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* saved playlists shortcut */}
      <Section className="mt-12" title="Made for You" action={<SeeAll href="/explore/playlists" />}>
        <Carousel>
          {savedSystemPlaylists.slice(0, 10).map((p) => (
            <MediaCard
              key={p.id}
              href={`/playlist/${p.id}`}
              title={p.name}
              subtitle={p.curator}
              cover={p.coverArt}
              playTracks={getTracks(p.trackIds)}
              className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]"
            />
          ))}
        </Carousel>
      </Section>
    </div>
  )
}

function LikedTab({
  tracks,
  playing,
  isCurrent,
  onPause,
  onResume,
  onPlay,
  total,
}: {
  tracks: Track[]
  playing: boolean
  isCurrent: boolean
  onPause: () => void
  onResume: () => void
  onPlay: () => void
  total: number
}) {
  if (!tracks.length) {
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" />}
        title="Nothing liked yet"
        description="Tap the heart on any song and it will show up here."
        action={
          <Link
            href="/explore/songs"
            className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white"
          >
            Find something to love
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="art art-shadow hidden h-24 w-24 overflow-hidden rounded-2xl sm:block">
            <img src={tracks[0].coverArt} alt="" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-serif text-[1.6rem] leading-none text-fg">Liked Songs</h2>
            <p className="mt-1 text-[12px] text-dim">
              {pluralize(tracks.length, 'song')} · {formatDuration(total)}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => (playing ? onPause() : isCurrent ? onResume() : onPlay())}
          className="rounded-full px-6"
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-[1px] fill-current" />}
          {playing ? 'Pause' : 'Play'}
        </Button>
      </div>
      <ul>
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} context={tracks} />
        ))}
      </ul>
    </div>
  )
}

function RecentTab({ tracks }: { tracks: Track[] }) {
  if (!tracks.length) {
    return (
      <EmptyState
        icon={<Clock className="h-6 w-6" />}
        title="No listening history yet"
        description="Play something and your recently played tracks will appear here."
        action={
          <Link
            href="/explore/trending"
            className="rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white"
          >
            Start listening
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {tracks.slice(0, 8).map((t) => (
          <MediaCard
            key={t.id}
            href={`/album/${t.albumId}`}
            title={t.title}
            subtitle={t.artistName}
            cover={t.coverArt}
            playTracks={[t]}
            meta={t.albumTitle}
          />
        ))}
      </div>
      <ul>
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} context={tracks} />
        ))}
      </ul>
    </div>
  )
}

function CreatePlaylistModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="Create playlist" description="Give it a name and a short description.">
      <div className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My playlist"
          aria-label="Playlist name"
          className="h-11 w-full rounded-xl border border-line/10 bg-base-soft px-4 text-[14px] text-fg outline-none transition-colors placeholder:text-dim focus:border-accent/50"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description…"
          rows={3}
          aria-label="Playlist description"
          className="w-full resize-none rounded-xl border border-line/10 bg-base-soft px-4 py-3 text-[13px] leading-relaxed text-fg outline-none transition-colors placeholder:text-dim focus:border-accent/50"
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onCreate(name.trim() || 'My Playlist', description.trim())
              setName('')
              setDescription('')
            }}
          >
            Create
          </Button>
        </div>
      </div>
    </Modal>
  )
}
