'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import type { Track } from '@/lib/types'
import { useLibrary } from '@/lib/store/library'
import { useToast } from '@/lib/store/toast'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

export function AddToPlaylistSheet({
  track,
  open,
  onClose,
}: {
  track: Track
  open: boolean
  onClose: () => void
}) {
  const { userPlaylists, addTrackToPlaylist, removeTrackFromPlaylist, createPlaylist } = useLibrary()
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const handleToggle = (playlistId: string, has: boolean) => {
    if (has) {
      removeTrackFromPlaylist(playlistId, track.id)
      toast('Removed from playlist', track.title, 'info')
    } else {
      addTrackToPlaylist(playlistId, track.id)
      toast('Added to playlist', track.title, 'music')
    }
  }

  const handleCreate = () => {
    const playlist = createPlaylist(name.trim() || 'My Playlist', '', [track.id])
    setCreating(false)
    setName('')
    toast('Playlist created', `${playlist.name} · 1 song`, 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to playlist"
      description={track.title}
      sheet
    >
      {creating ? (
        <div className="space-y-3 pt-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Playlist name"
            aria-label="Playlist name"
            className="h-11 w-full rounded-xl border border-line/10 bg-base-soft px-4 text-[13.5px] text-fg outline-none transition-colors placeholder:text-dim focus:border-accent/50"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      ) : (
        <>
          {userPlaylists.length === 0 ? (
            <EmptyState
              icon={<Plus className="h-5 w-5" />}
              title="No playlists yet"
              description="Create a playlist to start collecting songs you love."
              className="border-0 py-8"
              action={
                <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                  <Plus className="h-3.5 w-3.5" /> New playlist
                </Button>
              }
            />
          ) : (
            <ul className="space-y-0.5">
              {userPlaylists.map((p) => {
                const has = p.trackIds.includes(track.id)
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => handleToggle(p.id, has)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]',
                        has && 'bg-white/[0.03]'
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/30 to-indigo-600/30 text-[13px] font-semibold text-fg">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-fg">
                          {p.name}
                        </span>
                        <span className="block truncate text-[11px] text-dim">
                          {p.trackIds.length} {p.trackIds.length === 1 ? 'song' : 'songs'}
                        </span>
                      </span>
                      {has ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : (
                        <Plus className="h-4 w-4 text-dim" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {userPlaylists.length > 0 ? (
            <button
              onClick={() => setCreating(true)}
              className="mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-line/15 px-3 py-3 text-[13px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-fg"
            >
              <Plus className="h-4 w-4" />
              New playlist
            </button>
          ) : null}
        </>
      )}
    </Modal>
  )
}
