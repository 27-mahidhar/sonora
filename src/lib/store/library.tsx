'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createLibraryAdapter, type LibraryAdapter } from '@/lib/data/library-adapter'
import {
  getAlbum,
  getArtist,
  getPlaylist,
  getTrack,
  getTracks,
} from '@/lib/catalog-api'
import type { Album, Artist, HistoryEntry, Playlist, Track, UserPlaylist } from '@/lib/types'
import { uid } from '@/lib/utils'
import { useAuth } from '@/lib/store/auth'

interface LibraryContextValue {
  ready: boolean
  mode: 'local' | 'supabase'
  likedTrackIds: string[]
  likedTracks: Track[]
  followedArtistIds: string[]
  followedArtists: Artist[]
  savedAlbumIds: string[]
  savedAlbums: Album[]
  savedPlaylistIds: string[]
  savedSystemPlaylists: Playlist[]
  userPlaylists: UserPlaylist[]
  allPlaylists: Array<UserPlaylist | Playlist>
  history: HistoryEntry[]
  recentlyPlayed: Track[]

  isLiked: (trackId: string) => boolean
  isFollowing: (artistId: string) => boolean
  isAlbumSaved: (albumId: string) => boolean
  isPlaylistSaved: (playlistId: string) => boolean

  toggleLike: (trackId: string) => void
  toggleFollow: (artistId: string) => void
  toggleSaveAlbum: (albumId: string) => void
  toggleSavePlaylist: (playlistId: string) => void

  createPlaylist: (name: string, description?: string, trackIds?: string[]) => UserPlaylist
  updatePlaylist: (id: string, patch: Partial<Pick<UserPlaylist, 'name' | 'description' | 'isPublic'>>) => void
  deletePlaylist: (id: string) => void
  addTrackToPlaylist: (playlistId: string, trackId: string) => void
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void
  reorderPlaylist: (playlistId: string, from: number, to: number) => void

  recordPlay: (trackId: string, progress?: number) => void
  clearHistory: () => void
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const adapterRef = useRef<LibraryAdapter | null>(null)
  if (!adapterRef.current) adapterRef.current = createLibraryAdapter()

  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([])
  const [followedArtistIds, setFollowedArtistIds] = useState<string[]>([])
  const [savedAlbumIds, setSavedAlbumIds] = useState<string[]>([])
  const [savedPlaylistIds, setSavedPlaylistIds] = useState<string[]>([])
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [ready, setReady] = useState(false)

  const userId = user?.id ?? 'anonymous'

  /* ---------------------------- hydrate --------------------------- */
  useEffect(() => {
    let active = true
    setReady(false)
    const adapter = adapterRef.current
    if (!adapter) return

    adapter
      .load(userId)
      .then((state) => {
        if (!active) return
        setLikedTrackIds(state.likedTrackIds)
        setFollowedArtistIds(state.followedArtistIds)
        setSavedAlbumIds(state.savedAlbumIds)
        setSavedPlaylistIds(state.savedPlaylistIds)
        setUserPlaylists(state.playlists)
        setHistory(state.history)
      })
      .catch(() => {
        /* storage unavailable — continue with empty library */
      })
      .finally(() => {
        if (active) setReady(true)
      })

    return () => {
      active = false
    }
  }, [userId])

  const persist = useCallback((fn: (a: LibraryAdapter, uid: string) => Promise<void>) => {
    const adapter = adapterRef.current
    if (!adapter) return
    fn(adapter, userId).catch(() => {
      /* write failures are non-fatal in demo mode */
    })
  }, [userId])

  /* ------------------------------ likes --------------------------- */
  const isLiked = useCallback((id: string) => likedTrackIds.includes(id), [likedTrackIds])

  const toggleLike = useCallback(
    (trackId: string) => {
      const next = isLiked(trackId)
      setLikedTrackIds((prev) =>
        next ? prev.filter((id) => id !== trackId) : Array.from(new Set([...prev, trackId]))
      )
      persist((a, uid) => a.setLiked(uid, trackId, !next))
    },
    [isLiked, persist]
  )

  /* --------------------------- following -------------------------- */
  const isFollowing = useCallback((id: string) => followedArtistIds.includes(id), [followedArtistIds])

  const toggleFollow = useCallback(
    (artistId: string) => {
      const next = isFollowing(artistId)
      setFollowedArtistIds((prev) =>
        next ? prev.filter((id) => id !== artistId) : Array.from(new Set([...prev, artistId]))
      )
      persist((a, uid) => a.setFollowed(uid, artistId, !next))
    },
    [isFollowing, persist]
  )

  /* ---------------------------- albums ---------------------------- */
  const isAlbumSaved = useCallback((id: string) => savedAlbumIds.includes(id), [savedAlbumIds])

  const toggleSaveAlbum = useCallback(
    (albumId: string) => {
      const next = isAlbumSaved(albumId)
      setSavedAlbumIds((prev) =>
        next ? prev.filter((id) => id !== albumId) : Array.from(new Set([...prev, albumId]))
      )
      persist((a, uid) => a.setSavedAlbum(uid, albumId, !next))
    },
    [isAlbumSaved, persist]
  )

  /* --------------------------- playlists -------------------------- */
  const isPlaylistSaved = useCallback(
    (id: string) => savedPlaylistIds.includes(id),
    [savedPlaylistIds]
  )

  const toggleSavePlaylist = useCallback(
    (playlistId: string) => {
      const next = isPlaylistSaved(playlistId)
      setSavedPlaylistIds((prev) =>
        next ? prev.filter((id) => id !== playlistId) : Array.from(new Set([...prev, playlistId]))
      )
      persist((a, uid) => a.setSavedPlaylist(uid, playlistId, !next))
    },
    [isPlaylistSaved, persist]
  )

  /* ------------------------ user playlists ------------------------ */
  const createPlaylist = useCallback(
    (name: string, description = '', trackIds: string[] = []) => {
      const now = new Date().toISOString()
      const playlist: UserPlaylist = {
        id: uid('pl'),
        name: name.trim() || 'Untitled Playlist',
        description: description.trim(),
        trackIds,
        isPublic: false,
        createdAt: now,
        updatedAt: now,
        ownerId: userId,
      }
      setUserPlaylists((prev) => [playlist, ...prev])
      persist((a, uid) => a.savePlaylists(uid, [playlist, ...userPlaylists]))
      return playlist
    },
    [persist, userPlaylists, userId]
  )

  const updatePlaylist = useCallback(
    (id: string, patch: Partial<Pick<UserPlaylist, 'name' | 'description' | 'isPublic'>>) => {
      setUserPlaylists((prev) => {
        const next = prev.map((p) =>
          p.id === id
            ? { ...p, ...patch, name: patch.name?.trim() || p.name, updatedAt: new Date().toISOString() }
            : p
        )
        persist((a, uid) => a.savePlaylists(uid, next))
        return next
      })
    },
    [persist]
  )

  const deletePlaylist = useCallback(
    (id: string) => {
      setUserPlaylists((prev) => {
        const next = prev.filter((p) => p.id !== id)
        persist((a, uid) => a.savePlaylists(uid, next))
        return next
      })
      setSavedPlaylistIds((prev) => prev.filter((pid) => pid !== id))
    },
    [persist]
  )

  const addTrackToPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setUserPlaylists((prev) => {
        const next = prev.map((p) =>
          p.id === playlistId && !p.trackIds.includes(trackId)
            ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: new Date().toISOString() }
            : p
        )
        persist((a, uid) => a.savePlaylists(uid, next))
        return next
      })
    },
    [persist]
  )

  const removeTrackFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setUserPlaylists((prev) => {
        const next = prev.map((p) =>
          p.id === playlistId
            ? {
                ...p,
                trackIds: p.trackIds.filter((id) => id !== trackId),
                updatedAt: new Date().toISOString(),
              }
            : p
        )
        persist((a, uid) => a.savePlaylists(uid, next))
        return next
      })
    },
    [persist]
  )

  const reorderPlaylist = useCallback(
    (playlistId: string, from: number, to: number) => {
      setUserPlaylists((prev) => {
        const next = prev.map((p) => {
          if (p.id !== playlistId) return p
          const ids = [...p.trackIds]
          const [moved] = ids.splice(from, 1)
          if (!moved) return p
          ids.splice(to, 0, moved)
          return { ...p, trackIds: ids, updatedAt: new Date().toISOString() }
        })
        persist((a, uid) => a.savePlaylists(uid, next))
        return next
      })
    },
    [persist]
  )

  /* ----------------------------- history -------------------------- */
  const recordPlay = useCallback(
    (trackId: string, progress = 0) => {
      const entry: HistoryEntry = {
        trackId,
        playedAt: new Date().toISOString(),
        progress,
      }
      setHistory((prev) => [entry, ...prev].slice(0, 200))
      persist((a, uid) => a.appendHistory(uid, entry))
    },
    [persist]
  )

  const clearHistory = useCallback(() => {
    setHistory([])
    persist((a, uid) => a.clearHistory(uid))
  }, [persist])

  /* --------------------------- derived data ----------------------- */
  const likedTracks = useMemo(() => getTracks(likedTrackIds), [likedTrackIds])
  const followedArtists = useMemo(
    () =>
      followedArtistIds
        .map((id) => getArtist(id))
        .filter((a): a is Artist => Boolean(a)),
    [followedArtistIds]
  )
  const savedAlbums = useMemo(
    () =>
      savedAlbumIds
        .map((id) => getAlbum(id))
        .filter((a): a is Album => Boolean(a)),
    [savedAlbumIds]
  )
  const savedSystemPlaylists = useMemo(
    () =>
      savedPlaylistIds
        .map((id) => getPlaylist(id))
        .filter((p): p is Playlist => Boolean(p)),
    [savedPlaylistIds]
  )
  const recentlyPlayed = useMemo(() => {
    const seen = new Set<string>()
    const out: Track[] = []
    for (const entry of history) {
      if (seen.has(entry.trackId)) continue
      const track = getTrack(entry.trackId)
      if (!track) continue
      seen.add(entry.trackId)
      out.push(track)
      if (out.length >= 20) break
    }
    return out
  }, [history])

  const allPlaylists = useMemo(
    () => [...userPlaylists, ...savedSystemPlaylists],
    [userPlaylists, savedSystemPlaylists]
  )

  const value = useMemo<LibraryContextValue>(
    () => ({
      ready,
      mode: adapterRef.current?.mode ?? 'local',
      likedTrackIds,
      likedTracks,
      followedArtistIds,
      followedArtists,
      savedAlbumIds,
      savedAlbums,
      savedPlaylistIds,
      savedSystemPlaylists,
      userPlaylists,
      allPlaylists,
      history,
      recentlyPlayed,
      isLiked,
      isFollowing,
      isAlbumSaved,
      isPlaylistSaved,
      toggleLike,
      toggleFollow,
      toggleSaveAlbum,
      toggleSavePlaylist,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      reorderPlaylist,
      recordPlay,
      clearHistory,
    }),
    [
      ready,
      likedTrackIds,
      likedTracks,
      followedArtistIds,
      followedArtists,
      savedAlbumIds,
      savedAlbums,
      savedPlaylistIds,
      savedSystemPlaylists,
      userPlaylists,
      allPlaylists,
      history,
      recentlyPlayed,
      isLiked,
      isFollowing,
      isAlbumSaved,
      isPlaylistSaved,
      toggleLike,
      toggleFollow,
      toggleSaveAlbum,
      toggleSavePlaylist,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      reorderPlaylist,
      recordPlay,
      clearHistory,
    ]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider')
  return ctx
}
