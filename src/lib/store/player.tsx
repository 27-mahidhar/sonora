'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { Track } from '@/lib/types'
import { clamp, shuffleArray } from '@/lib/utils'
import { useLibrary } from '@/lib/store/library'
import { useToast } from '@/lib/store/toast'

export type RepeatMode = 'off' | 'all' | 'one'
export type PlayerPanel = 'queue' | 'lyrics' | null

interface PlayerContextValue {
  queue: Track[]
  index: number
  current: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  buffered: number
  volume: number
  muted: boolean
  shuffle: boolean
  repeat: RepeatMode
  isLoading: boolean
  error: string | null
  fullScreen: boolean
  panel: PlayerPanel

  playTrack: (track: Track, context?: Track[]) => void
  playQueue: (tracks: Track[], startIndex?: number) => void
  toggle: () => void
  pause: () => void
  resume: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  seekBy: (delta: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (track: Track) => void
  playNext: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  jumpTo: (index: number) => void
  setFullScreen: (v: boolean) => void
  setPanel: (p: PlayerPanel) => void
  togglePanel: (p: Exclude<PlayerPanel, null>) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

/**
 * If a catalogue source is unreachable, we transparently fall back to a
 * known-good stream so the demo never dead-ends. Swap this list for your
 * licensed provider's CDN in production.
 */
const FALLBACK_STREAMS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
]

const VOL_KEY = 'sonora.volume.v1' 
const SHUFFLE_KEY = 'sonora.shuffle.v1'
const REPEAT_KEY = 'sonora.repeat.v1'

function readBool(key: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : raw === '1'
  } catch {
    return fallback
  }
}

function readNum(key: string, fallback: number) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fallbackAttempt = useRef(0)
  const rafRef = useRef<number | null>(null)
  const { recordPlay, toggleLike, isLiked } = useLibrary()
  const { toast } = useToast()

  /* ------------------------- reactive state ------------------------ */
  const [queue, setQueue] = useState<Track[]>([])
  const [index, setIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(0.72)
  const [muted, setMuted] = useState(false)
  const [shuffle, setShuffleState] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>('off')
  const [duration, setDuration] = useState(0)
  const [fullScreen, setFullScreen] = useState(false)
  const [panel, setPanel] = useState<PlayerPanel>(null)

  /* -------------------- high-frequency time store ------------------ */
  const timeRef = useRef(0)
  const bufferedRef = useRef(0)
  const timeListeners = useRef(new Set<() => void>())

  const subscribe = useCallback((cb: () => void) => {
    timeListeners.current.add(cb)
    return () => {
      timeListeners.current.delete(cb)
    }
  }, [])

  const emit = useCallback(() => {
    timeListeners.current.forEach((l) => l())
  }, [])

  const getTime = useCallback(() => timeRef.current, [])
  const getBuffered = useCallback(() => bufferedRef.current, [])
  const getServerTime = useCallback(() => 0, [])

  const currentTime = useSyncExternalStore(subscribe, getTime, getServerTime)
  const buffered = useSyncExternalStore(subscribe, getBuffered, getServerTime)

  /* --------------------------- restore prefs ----------------------- */
  useEffect(() => {
    setVolumeState(clamp(readNum(VOL_KEY, 0.72), 0, 1))
    setShuffleState(readBool(SHUFFLE_KEY, false))
    const r = readBool(REPEAT_KEY, false)
    setRepeat(r ? 'all' : 'off')
  }, [])

  /* ------------------------------ audio ---------------------------- */
  const ensureAudio = useCallback(() => {
    if (typeof window === 'undefined') return null
    if (!audioRef.current) {
      const el = new Audio()
      el.preload = 'auto'
      // NOTE: no `crossOrigin` attribute. Plain cross-origin playback does not
      // require CORS, and setting it would make hosts without CORS headers fail.
      audioRef.current = el
    }
    return audioRef.current
  }, [])

  const current = index >= 0 && index < queue.length ? queue[index] : null

  /* -------------------------- load track --------------------------- */
  useEffect(() => {
    const audio = ensureAudio()
    if (!audio) return
    if (!current) return

    let cancelled = false
    setIsLoading(true)
    setError(null)
    fallbackAttempt.current = 0

    if (audio.src !== current.audioUrl) {
      audio.src = current.audioUrl
      audio.load()
    }
    timeRef.current = 0
    bufferedRef.current = 0
    emit()

    const onCanPlay = () => {
      if (cancelled) return
      setIsLoading(false)
    }
    const onLoadedMetadata = () => {
      if (cancelled) return
      setDuration(Number.isFinite(audio.duration) ? audio.duration : current.duration)
    }
    const onPlaying = () => {
      if (cancelled) return
      setIsLoading(false)
      setIsPlaying(true)
    }
    const onWaiting = () => {
      if (!cancelled) setIsLoading(true)
    }
    const onPaused = () => {
      if (!cancelled) setIsPlaying(false)
    }
    const onError = () => {
      if (cancelled) return
      // Transparently retry against a known-good stream before giving up.
      if (fallbackAttempt.current < FALLBACK_STREAMS.length) {
        const next = FALLBACK_STREAMS[fallbackAttempt.current]
        fallbackAttempt.current += 1
        audio.src = next
        audio.load()
        audio.play().catch(() => setIsPlaying(false))
        return
      }
      setIsLoading(false)
      setIsPlaying(false)
      setError('This track could not be loaded.')
      toast('Playback error', 'The audio source did not respond.', 'error')
    }

    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('pause', onPaused)
    audio.addEventListener('error', onError)

    audio.volume = muted ? 0 : volume
    audio.play().catch(() => {
      // Autoplay can be blocked until the user interacts — the UI reflects
      // `isPlaying` so the user can tap play.
      setIsLoading(false)
    })

    return () => {
      cancelled = true
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('pause', onPaused)
      audio.removeEventListener('error', onError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.audioUrl])

  /* ---------------------------- rAF loop --------------------------- */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !isPlaying) return

    let last = 0
    const tick = (now: number) => {
      const el = audioRef.current
      if (!el) return
      if (now - last > 120) {
        timeRef.current = el.currentTime
        const b = el.buffered
        bufferedRef.current = b.length ? b.end(b.length - 1) : 0
        emit()
        last = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, emit])

  /* ------------------------------ ended ---------------------------- */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0
        audio.play()
        return
      }
      if (index < queue.length - 1) {
        setIndex((i) => i + 1)
      } else if (repeat === 'all' && queue.length) {
        setIndex(0)
      } else {
        setIsPlaying(false)
        timeRef.current = 0
        emit()
      }
    }
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [index, queue.length, repeat])

  /* --------------------------- media session ----------------------- */
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !current) return
    const artwork = [
      { src: current.coverArt, sizes: '96x96', type: 'image/svg+xml' },
      { src: current.coverArt, sizes: '512x512', type: 'image/svg+xml' },
    ]
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artistName,
        album: current.albumTitle,
        artwork,
      })
      navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play())
      navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause())
      navigator.mediaSession.setActionHandler('nexttrack', () => next())
      navigator.mediaSession.setActionHandler('previoustrack', () => prev())
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime != null) audioRef.current && (audioRef.current.currentTime = details.seekTime)
      })
    } catch {
      /* unsupported */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, index])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    } catch {
      /* ignore */
    }
  }, [isPlaying])

  /* ---------------------------- record play ------------------------ */
  useEffect(() => {
    if (!current || !isPlaying) return
    recordPlay(current.id, timeRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, isPlaying])

  /* ------------------------------ actions -------------------------- */
  const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
    if (!tracks.length) return
    setQueue(tracks)
    setIndex(clamp(startIndex, 0, tracks.length - 1))
    setIsPlaying(true)
  }, [])

  const playTrack = useCallback(
    (track: Track, context?: Track[]) => {
      if (context && context.length) {
        const idx = context.findIndex((t) => t.id === track.id)
        setQueue(context)
        setIndex(idx >= 0 ? idx : 0)
      } else {
        setQueue([track])
        setIndex(0)
      }
      setIsPlaying(true)
    },
    []
  )

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [current])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => setIsPlaying(false))
  }, [])

  const next = useCallback(() => {
    if (!queue.length) return
    setIndex((i) => {
      if (i < queue.length - 1) return i + 1
      if (repeat === 'all') return 0
      return i
    })
  }, [queue.length, repeat])

  const prev = useCallback(() => {
    const audio = audioRef.current
    if (!queue.length) return
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      timeRef.current = 0
      emit()
      return
    }
    setIndex((i) => (i > 0 ? i - 1 : queue.length - 1))
  }, [queue.length, emit])

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current
      if (!audio) return
      const clamped = clamp(seconds, 0, Number.isFinite(audio.duration) ? audio.duration : seconds)
      audio.currentTime = clamped
      timeRef.current = clamped
      emit()
    },
    [emit]
  )

  const seekBy = useCallback(
    (delta: number) => {
      seek(timeRef.current + delta)
    },
    [seek]
  )

  const setVolume = useCallback((v: number) => {
    const clamped = clamp(v, 0, 1)
    setVolumeState(clamped)
    if (clamped > 0) setMuted(false)
    try {
      window.localStorage.setItem(VOL_KEY, String(clamped))
    } catch {
      /* ignore */
    }
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = muted ? 0 : volume
  }, [volume, muted])

  const toggleShuffle = useCallback(() => {
    setShuffleState((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(SHUFFLE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      if (!current) return next
      if (next) {
        const rest = queue.filter((t) => t.id !== current.id)
        setQueue([current, ...shuffleArray(rest)])
        setIndex(0)
      } else {
        // restore original order is impossible without the source list, so we
        // keep the current queue but move to the current track's position.
        setQueue((q) => q)
      }
      return next
    })
  }, [current, queue])

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => {
      const next: RepeatMode = r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'
      try {
        window.localStorage.setItem(REPEAT_KEY, next === 'off' ? '0' : '1')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const addToQueue = useCallback(
    (track: Track) => {
      setQueue((q) => {
        if (q.some((t) => t.id === track.id)) return q
        return [...q, track]
      })
      toast('Added to queue', `${track.title} · ${track.artistName}`, 'music')
    },
    [toast]
  )

  const playNext = useCallback(
    (track: Track) => {
      setQueue((q) => {
        const filtered = q.filter((t) => t.id !== track.id)
        const insertAt = Math.min(index + 1, filtered.length)
        const nextQueue = [...filtered.slice(0, insertAt), track, ...filtered.slice(insertAt)]
        return nextQueue
      })
      toast('Playing next', `${track.title} · ${track.artistName}`, 'music')
    },
    [index, toast]
  )

  const removeFromQueue = useCallback(
    (i: number) => {
      setQueue((q) => {
        const next = q.filter((_, idx) => idx !== i)
        if (i < index) setIndex(index - 1)
        else if (i === index && index >= next.length) setIndex(Math.max(0, next.length - 1))
        return next
      })
    },
    [index]
  )

  const clearQueue = useCallback(() => {
    setQueue((q) => (current ? [current] : []))
    setIndex(current ? 0 : -1)
    toast('Queue cleared', '', 'info')
  }, [current, toast])

  const jumpTo = useCallback((i: number) => {
    setIndex(clamp(i, 0, Number.MAX_SAFE_INTEGER))
    setIsPlaying(true)
  }, [])

  /* ------------------------- keyboard shortcuts -------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT')
      ) {
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case ' ':
          if (!current) return
          e.preventDefault()
          toggle()
          break
        case 'arrowright':
          if (e.shiftKey) next()
          else seekBy(5)
          break
        case 'arrowleft':
          if (e.shiftKey) prev()
          else seekBy(-5)
          break
        case 'arrowup':
          e.preventDefault()
          setVolume(volume + 0.05)
          break
        case 'arrowdown':
          e.preventDefault()
          setVolume(volume - 0.05)
          break
        case 'm':
          toggleMute()
          break
        case 'n':
          next()
          break
        case 'p':
          prev()
          break
        case 's':
          toggleShuffle()
          break
        case 'r':
          cycleRepeat()
          break
        case 'l':
          if (current) toggleLike(current.id)
          break
        case 'f':
          setFullScreen((v) => !v)
          break
        case 'q':
          setPanel((p) => (p === 'queue' ? null : 'queue'))
          break
        case 'y':
          setPanel((p) => (p === 'lyrics' ? null : 'lyrics'))
          break
        case 'escape':
          if (fullScreen) setFullScreen(false)
          else setPanel(null)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    current,
    toggle,
    next,
    prev,
    seekBy,
    setVolume,
    volume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    fullScreen,
  ])

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      index,
      current,
      isPlaying,
      currentTime,
      duration,
      buffered,
      volume,
      muted,
      shuffle,
      repeat,
      isLoading,
      error,
      fullScreen,
      panel,
      playTrack,
      playQueue,
      toggle,
      pause,
      resume,
      next,
      prev,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      jumpTo,
      setFullScreen,
      setPanel,
      togglePanel: (p) => setPanel((prev) => (prev === p ? null : p)),
    }),
    [
      queue,
      index,
      current,
      isPlaying,
      currentTime,
      duration,
      buffered,
      volume,
      muted,
      shuffle,
      repeat,
      isLoading,
      error,
      fullScreen,
      panel,
      playTrack,
      playQueue,
      toggle,
      pause,
      resume,
      next,
      prev,
      seek,
      seekBy,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      jumpTo,
    ]
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider')
  return ctx
}

/** Convenience hook: is this track the one currently loaded? */
export function useIsCurrent(trackId: string) {
  const { current } = usePlayer()
  return current?.id === trackId
}
