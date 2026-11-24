'use client'

import { getSupabaseBrowser, supabaseConfigured } from '@/lib/supabase/client'
import type { HistoryEntry, LibraryState, UserPlaylist } from '@/lib/types'

/**
 * Persistence boundary for the user's library.
 *
 * The React layer never talks to storage directly — it calls the adapter, so
 * swapping local demo storage for Supabase (or any licensed backend) is a
 * one-line change in `createLibraryAdapter()`.
 */
export interface LibraryAdapter {
  readonly mode: 'local' | 'supabase'
  load(userId: string): Promise<LibraryState>
  setLiked(userId: string, trackId: string, liked: boolean): Promise<void>
  setFollowed(userId: string, artistId: string, followed: boolean): Promise<void>
  setSavedAlbum(userId: string, albumId: string, saved: boolean): Promise<void>
  setSavedPlaylist(userId: string, playlistId: string, saved: boolean): Promise<void>
  savePlaylists(userId: string, playlists: UserPlaylist[]): Promise<void>
  appendHistory(userId: string, entry: HistoryEntry): Promise<void>
  clearHistory(userId: string): Promise<void>
  clearAll(userId: string): Promise<void>
}

const EMPTY: LibraryState = {
  likedTrackIds: [],
  followedArtistIds: [],
  savedAlbumIds: [],
  savedPlaylistIds: [],
  playlists: [],
  history: [],
}

/* ------------------------------------------------------------------ */
/* Local (demo) adapter                                                */
/* ------------------------------------------------------------------ */
const KEY = 'sonora.library.v1'

class LocalLibraryAdapter implements LibraryAdapter {
  readonly mode = 'local' as const

  private read(userId: string): LibraryState {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (!raw) return { ...EMPTY }
      const parsed = JSON.parse(raw) as Record<string, LibraryState>
      return parsed[userId] ?? { ...EMPTY }
    } catch {
      return { ...EMPTY }
    }
  }

  private write(userId: string, state: LibraryState) {
    try {
      const raw = window.localStorage.getItem(KEY)
      const all = raw ? (JSON.parse(raw) as Record<string, LibraryState>) : {}
      all[userId] = state
      window.localStorage.setItem(KEY, JSON.stringify(all))
    } catch {
      /* quota exceeded — non-fatal */
    }
  }

  private mutate(userId: string, fn: (s: LibraryState) => LibraryState) {
    this.write(userId, fn(this.read(userId)))
  }

  async load(userId: string) {
    return this.read(userId)
  }

  async setLiked(userId: string, trackId: string, liked: boolean) {
    this.mutate(userId, (s) => ({
      ...s,
      likedTrackIds: liked
        ? Array.from(new Set([...s.likedTrackIds, trackId]))
        : s.likedTrackIds.filter((id) => id !== trackId),
    }))
  }

  async setFollowed(userId: string, artistId: string, followed: boolean) {
    this.mutate(userId, (s) => ({
      ...s,
      followedArtistIds: followed
        ? Array.from(new Set([...s.followedArtistIds, artistId]))
        : s.followedArtistIds.filter((id) => id !== artistId),
    }))
  }

  async setSavedAlbum(userId: string, albumId: string, saved: boolean) {
    this.mutate(userId, (s) => ({
      ...s,
      savedAlbumIds: saved
        ? Array.from(new Set([...s.savedAlbumIds, albumId]))
        : s.savedAlbumIds.filter((id) => id !== albumId),
    }))
  }

  async setSavedPlaylist(userId: string, playlistId: string, saved: boolean) {
    this.mutate(userId, (s) => ({
      ...s,
      savedPlaylistIds: saved
        ? Array.from(new Set([...s.savedPlaylistIds, playlistId]))
        : s.savedPlaylistIds.filter((id) => id !== playlistId),
    }))
  }

  async savePlaylists(userId: string, playlists: UserPlaylist[]) {
    this.mutate(userId, (s) => ({ ...s, playlists }))
  }

  async appendHistory(userId: string, entry: HistoryEntry) {
    this.mutate(userId, (s) => ({
      ...s,
      history: [entry, ...s.history].slice(0, 200),
    }))
  }

  async clearHistory(userId: string) {
    this.mutate(userId, (s) => ({ ...s, history: [] }))
  }

  async clearAll(userId: string) {
    this.write(userId, { ...EMPTY })
  }
}

/* ------------------------------------------------------------------ */
/* Supabase adapter                                                    */
/* ------------------------------------------------------------------ */
class SupabaseLibraryAdapter implements LibraryAdapter {
  readonly mode = 'supabase' as const

  private client() {
    const c = getSupabaseBrowser()
    if (!c) throw new Error('Supabase client unavailable')
    return c
  }

  async load(userId: string): Promise<LibraryState> {
    const supabase = this.client()

    const [liked, followed, albums, savedPls, pls, history] = await Promise.all([
      supabase.from('liked_tracks').select('track_id').eq('user_id', userId),
      supabase.from('followed_artists').select('artist_id').eq('user_id', userId),
      supabase.from('saved_albums').select('album_id').eq('user_id', userId),
      supabase.from('saved_playlists').select('playlist_id').eq('user_id', userId),
      supabase
        .from('playlists')
        .select('id, name, description, is_public, created_at, updated_at, playlist_tracks(track_id, position)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('listening_history')
        .select('track_id, played_at, progress')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(100),
    ])

    const playlists: UserPlaylist[] = (pls.data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      isPublic: Boolean(p.is_public),
      createdAt: p.created_at,
      updatedAt: p.updated_at ?? p.created_at,
      ownerId: userId,
      trackIds: (p.playlist_tracks ?? [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((pt: any) => pt.track_id),
    }))

    return {
      likedTrackIds: (liked.data ?? []).map((r: any) => r.track_id),
      followedArtistIds: (followed.data ?? []).map((r: any) => r.artist_id),
      savedAlbumIds: (albums.data ?? []).map((r: any) => r.album_id),
      savedPlaylistIds: (savedPls.data ?? []).map((r: any) => r.playlist_id),
      playlists,
      history: (history.data ?? []).map((r: any) => ({
        trackId: r.track_id,
        playedAt: r.played_at,
        progress: r.progress ?? 0,
      })),
    }
  }

  async setLiked(userId: string, trackId: string, liked: boolean) {
    const supabase = this.client()
    if (!liked) {
      await supabase.from('liked_tracks').delete().eq('user_id', userId).eq('track_id', trackId)
      return
    }
    await supabase.from('liked_tracks').upsert({ user_id: userId, track_id: trackId })
  }

  async setFollowed(userId: string, artistId: string, followed: boolean) {
    const supabase = this.client()
    if (!followed) {
      await supabase
        .from('followed_artists')
        .delete()
        .eq('user_id', userId)
        .eq('artist_id', artistId)
      return
    }
    await supabase.from('followed_artists').upsert({ user_id: userId, artist_id: artistId })
  }

  async setSavedAlbum(userId: string, albumId: string, saved: boolean) {
    const supabase = this.client()
    if (!saved) {
      await supabase.from('saved_albums').delete().eq('user_id', userId).eq('album_id', albumId)
      return
    }
    await supabase.from('saved_albums').upsert({ user_id: userId, album_id: albumId })
  }

  async setSavedPlaylist(userId: string, playlistId: string, saved: boolean) {
    const supabase = this.client()
    if (!saved) {
      await supabase
        .from('saved_playlists')
        .delete()
        .eq('user_id', userId)
        .eq('playlist_id', playlistId)
      return
    }
    await supabase.from('saved_playlists').upsert({ user_id: userId, playlist_id: playlistId })
  }

  async savePlaylists(userId: string, playlists: UserPlaylist[]) {
    const supabase = this.client()
    const { data: existing } = await supabase
      .from('playlists')
      .select('id')
      .eq('owner_id', userId)
    const existingIds = new Set<string>((existing ?? []).map((r: any) => r.id as string))
    const keep = new Set(playlists.map((p) => p.id))

    const removed = [...existingIds].filter((id) => !keep.has(id))
    if (removed.length) {
      await supabase.from('playlists').delete().in('id', removed).eq('owner_id', userId)
    }

    for (const p of playlists) {
      await supabase
        .from('playlists')
        .upsert({
          id: p.id,
          owner_id: userId,
          name: p.name,
          description: p.description,
          is_public: p.isPublic,
          updated_at: new Date().toISOString(),
        })
      await supabase.from('playlist_tracks').delete().eq('playlist_id', p.id)
      if (p.trackIds.length) {
        await supabase.from('playlist_tracks').insert(
          p.trackIds.map((trackId, position) => ({ playlist_id: p.id, track_id: trackId, position }))
        )
      }
    }
  }

  async appendHistory(userId: string, entry: HistoryEntry) {
    const supabase = this.client()
    await supabase.from('listening_history').insert({
      user_id: userId,
      track_id: entry.trackId,
      played_at: entry.playedAt,
      progress: entry.progress,
    })
  }

  async clearHistory(userId: string) {
    const supabase = this.client()
    await supabase.from('listening_history').delete().eq('user_id', userId)
  }

  async clearAll(userId: string) {
    const supabase = this.client()
    await Promise.all([
      supabase.from('liked_tracks').delete().eq('user_id', userId),
      supabase.from('followed_artists').delete().eq('user_id', userId),
      supabase.from('saved_albums').delete().eq('user_id', userId),
      supabase.from('saved_playlists').delete().eq('user_id', userId),
      supabase.from('listening_history').delete().eq('user_id', userId),
    ])
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */
export function createLibraryAdapter(): LibraryAdapter {
  if (typeof window !== 'undefined' && supabaseConfigured) {
    return new SupabaseLibraryAdapter()
  }
  return new LocalLibraryAdapter()
}
