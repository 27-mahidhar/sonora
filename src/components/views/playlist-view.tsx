'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import {
  GripVertical,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import type { Playlist, Track, UserPlaylist } from '@/lib/types'
import { catalog, getTracks } from '@/lib/catalog-api'
import { usePlayer } from '@/lib/store/player'
import { useLibrary } from '@/lib/store/library'
import { useToast } from '@/lib/store/toast'
import { cn, formatCompact, formatLongDuration, pluralize } from '@/lib/utils'
import { TrackRow } from '@/components/cards/track-row'
import { DetailHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/primitives'
import { Modal, ConfirmDialog } from '@/components/ui/modal'

interface PlaylistViewProps {
  playlist: Playlist | UserPlaylist
  isOwned: boolean
}

export function PlaylistView({ playlist, isOwned }: PlaylistViewProps) {
  const system = 'system' in playlist && playlist.system
  const tracks = useMemo(() => getTracks(playlist.trackIds), [playlist.trackIds])

  return (
    <PlaylistViewInner
      key={playlist.id}
      playlist={playlist}
      isOwned={!system && isOwned}
      tracks={tracks}
    />
  )
}

function PlaylistViewInner({
  playlist,
  isOwned,
  tracks,
}: {
  playlist: Playlist | UserPlaylist
  isOwned: boolean
  tracks: Track[]
}) {
  const router = useRouter()
  const { playQueue, isPlaying, current, pause, resume } = usePlayer()
  const {
    isPlaylistSaved,
    toggleSavePlaylist,
    updatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylist,
    userPlaylists,
    createPlaylist,
  } = useLibrary()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')

  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const isCurrent = !!current && tracks.some((t) => t.id === current.id)
  const playing = isCurrent && isPlaying
  const saved = isPlaylistSaved(playlist.id)
  const total = tracks.reduce((s, t) => s + t.duration, 0)

  const cover =
    tracks[0]?.coverArt ??
    ('coverArt' in playlist ? playlist.coverArt : undefined) ??
    catalog.playlists[0].coverArt

  const filtered = search.trim()
    ? tracks.filter((t) =>
        `${t.title} ${t.artistName}`.toLowerCase().includes(search.toLowerCase())
      )
    : tracks

  const handlePlay = () => {
    if (playing) pause()
    else if (isCurrent) resume()
    else playQueue(tracks, 0)
  }

  const saveEdits = () => {
    updatePlaylist(playlist.id, { name, description })
    setEditing(false)
    toast('Playlist updated', name, 'success')
  }

  return (
    <>
      <DetailHeader
        cover={cover}
        eyebrow="Playlist"
        title={playlist.name}
        description={playlist.description}
        meta={
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 md:justify-start">
            <span className="font-medium text-fg/80">
              {'curator' in playlist ? playlist.curator : 'You'}
            </span>
            <span>·</span>
            <span>{pluralize(tracks.length, 'song')}</span>
            {total ? (
              <>
                <span>·</span>
                <span>{formatLongDuration(total)}</span>
              </>
            ) : null}
            {'followers' in playlist ? (
              <>
                <span>·</span>
                <span>{formatCompact(playlist.followers)} saves</span>
              </>
            ) : null}
          </span>
        }
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlay}
              disabled={!tracks.length}
              aria-label={playing ? `Pause ${playlist.name}` : `Play ${playlist.name}`}
              className="rounded-full px-7"
            >
              {playing ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px] fill-current" />
              )}
              {playing ? 'Pause' : 'Play'}
            </Button>

            {isOwned ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setEditing(true)}
                  className="rounded-full"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setAddOpen(true)}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4" />
                  Add songs
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete playlist"
                  className="rounded-full text-rose-400/80 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  toggleSavePlaylist(playlist.id)
                  toast(saved ? 'Removed from library' : 'Saved to library', playlist.name, 'music')
                }}
                className={cn('rounded-full', saved && 'text-accent-soft')}
                aria-pressed={saved}
              >
                {saved ? 'Saved' : 'Save'}
              </Button>
            )}
          </>
        }
      />

      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        {tracks.length > 8 ? (
          <div className="mb-3 flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in playlist"
                aria-label="Search in playlist"
                className="h-9 w-56 rounded-full border border-line/10 bg-elevated pl-9 pr-3 text-[12.5px] text-fg outline-none transition-colors placeholder:text-dim focus:border-accent/40"
              />
            </div>
            {isOwned && !editing ? (
              <span className="ml-auto hidden text-[11px] text-dim sm:block">
                Tip: drag to reorder
              </span>
            ) : null}
          </div>
        ) : null}

        {editing ? (
          <div className="hairline mb-6 space-y-4 rounded-2xl bg-elevated p-5">
            <div>
              <label htmlFor="pl-name" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-dim">
                Name
              </label>
              <input
                id="pl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-xl border border-line/10 bg-base-soft px-4 text-[14px] text-fg outline-none transition-colors focus:border-accent/50"
              />
            </div>
            <div>
              <label htmlFor="pl-desc" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-dim">
                Description
              </label>
              <textarea
                id="pl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-line/10 bg-base-soft px-4 py-3 text-[13px] leading-relaxed text-fg outline-none transition-colors focus:border-accent/50"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={saveEdits}>
                Save changes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setName(playlist.name)
                  setDescription(playlist.description)
                  setEditing(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {tracks.length === 0 ? (
          <EmptyState
            icon={<Music2 className="h-6 w-6" />}
            title="This playlist is empty"
            description={
              isOwned
                ? 'Add some songs to get this playlist going.'
                : 'Nothing here yet — check back soon.'
            }
            action={
              isOwned ? (
                <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add songs
                </Button>
              ) : undefined
            }
            className="mt-2"
          />
        ) : (
          <ul
            className={cn(isOwned && 'rounded-xl')}
            onDragOver={(e) => e.preventDefault()}
          >
            {filtered.map((t, i) => {
              const realIndex = tracks.findIndex((x) => x.id === t.id)
              return (
                <div
                  key={t.id}
                  draggable={isOwned && !search.trim()}
                  onDragStart={() => {
                    dragIndex.current = realIndex
                  }}
                  onDragEnter={() => setOverIndex(realIndex)}
                  onDragEnd={() => {
                    setOverIndex(null)
                    dragIndex.current = null
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIndex.current !== null && dragIndex.current !== realIndex) {
                      reorderPlaylist(playlist.id, dragIndex.current, realIndex)
                    }
                    setOverIndex(null)
                    dragIndex.current = null
                  }}
                  className={cn(
                    'relative',
                    overIndex === realIndex && dragIndex.current !== realIndex && 'bg-accent/10'
                  )}
                >
                  <TrackRow track={t} index={i} context={tracks} showAlbum />
                  {isOwned && !search.trim() ? (
                    <div className="absolute right-9 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                      <button
                        aria-label="Drag to reorder"
                        className="cursor-grab p-1 text-dim/50 opacity-0 transition-opacity hover:text-fg group-hover:opacity-100 [.group\/track:hover_&]:opacity-100"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeTrackFromPlaylist(playlist.id, t.id)}
                        aria-label={`Remove ${t.title} from playlist`}
                        className="rounded-full p-1 text-dim/60 opacity-0 transition-all hover:bg-white/10 hover:text-fg [.group\/track:hover_&]:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </ul>
        )}

        {filtered.length === 0 && tracks.length > 0 ? (
          <p className="py-8 text-center text-[13px] text-dim">No songs match “{search}”.</p>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePlaylist(playlist.id)
          toast('Playlist deleted', playlist.name, 'info')
          router.push('/library?tab=playlists')
        }}
        title={`Delete “${playlist.name}”?`}
        description="This can’t be undone. The songs stay in your library."
        confirmLabel="Delete"
        danger
      />

      <AddSongsSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        playlistId={playlist.id}
        existing={tracks}
      />
    </>
  )
}

function AddSongsSheet({
  open,
  onClose,
  playlistId,
  existing,
}: {
  open: boolean
  onClose: () => void
  playlistId: string
  existing: Track[]
}) {
  const { addTrackToPlaylist } = useLibrary()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const existingIds = new Set(existing.map((t) => t.id))

  const pool = catalog.tracks
    .filter((t) => !existingIds.has(t.id))
    .filter((t) => (q.trim() ? `${t.title} ${t.artistName}`.toLowerCase().includes(q.toLowerCase()) : true))
    .slice(0, 30)

  return (
    <Modal open={open} onClose={onClose} title="Add songs" description="Search the catalogue" sheet>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search songs or artists"
        aria-label="Search songs"
        className="mb-3 h-10 w-full rounded-full border border-line/10 bg-base-soft px-4 text-[13px] text-fg outline-none placeholder:text-dim focus:border-accent/40"
      />
      <ul className="space-y-0.5">
        {pool.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => {
                addTrackToPlaylist(playlistId, t.id)
                toast('Added to playlist', t.title, 'music')
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.05]"
            >
              <img src={t.coverArt} alt="" className="h-9 w-9 rounded-md object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-fg">{t.title}</span>
                <span className="block truncate text-[11px] text-dim">{t.artistName}</span>
              </span>
              <Plus className="h-4 w-4 text-dim" />
            </button>
          </li>
        ))}
      </ul>
      {pool.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-dim">No more songs to add.</p>
      ) : null}
    </Modal>
  )
}
