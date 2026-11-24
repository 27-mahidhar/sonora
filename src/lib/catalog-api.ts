import { catalog } from '@/data/catalog'
import type { Album, Artist, Catalog, Genre, Playlist, Podcast, Track } from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Index maps                                                          */
/* ------------------------------------------------------------------ */
export const tracksById = new Map(catalog.tracks.map((t) => [t.id, t]))
export const albumsById = new Map(catalog.albums.map((a) => [a.id, a]))
export const artistsById = new Map(catalog.artists.map((a) => [a.id, a]))
export const playlistsById = new Map(catalog.playlists.map((p) => [p.id, p]))
export const genresById = new Map(catalog.genres.map((g) => [g.id, g]))
export const podcastsById = new Map(catalog.podcasts.map((p) => [p.id, p]))

export const getTrack = (id: string): Track | undefined => tracksById.get(id)
export const getAlbum = (id: string): Album | undefined => albumsById.get(id)
export const getArtist = (id: string): Artist | undefined => artistsById.get(id)
export const getPlaylist = (id: string): Playlist | undefined => playlistsById.get(id)
export const getGenre = (id: string): Genre | undefined => genresById.get(id)
export const getPodcast = (id: string): Podcast | undefined => podcastsById.get(id)

export function getTracks(ids: string[] | undefined): Track[] {
  if (!ids) return []
  return ids.map((id) => tracksById.get(id)).filter((t): t is Track => Boolean(t))
}

export function getArtists(ids: string[] | undefined): Artist[] {
  if (!ids) return []
  return ids.map((id) => artistsById.get(id)).filter((a): a is Artist => Boolean(a))
}

export function getAlbums(ids: string[] | undefined): Album[] {
  if (!ids) return []
  return ids.map((id) => albumsById.get(id)).filter((a): a is Album => Boolean(a))
}

/* ------------------------------------------------------------------ */
/* Derived collections                                                 */
/* ------------------------------------------------------------------ */
export const trendingTracks = [...catalog.tracks].sort((a, b) => b.plays - a.plays)

export const newReleases = [...catalog.albums]
  .sort((a, b) => b.year - a.year || a.id.localeCompare(b.id))
  .slice(0, 20)

export const newReleaseAlbums = [...catalog.albums].sort((a, b) => b.year - a.year)

export const featuredArtists = [...catalog.artists]
  .sort((a, b) => b.monthlyListeners - a.monthlyListeners)
  .slice(0, 12)

export function tracksByLanguage(language: string, limit = 10): Track[] {
  return catalog.tracks.filter((t) => t.language === language).slice(0, limit)
}

export function albumsByArtist(artistId: string): Album[] {
  return catalog.albums.filter((a) => a.artistId === artistId)
}

export function artistTracks(artistId: string): Track[] {
  return catalog.tracks.filter((t) => t.artistId === artistId)
}

export function relatedArtists(artist: Artist): Artist[] {
  return getArtists(artist.relatedIds)
}

export const systemPlaylists = catalog.playlists

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */
export interface SearchResults {
  tracks: Track[]
  artists: Artist[]
  albums: Album[]
  playlists: Playlist[]
  podcasts: Podcast[]
  genres: Genre[]
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export function searchCatalog(query: string, limit = 6): SearchResults {
  const q = norm(query.trim())
  const empty: SearchResults = {
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
    podcasts: [],
    genres: [],
  }
  if (!q) return empty

  const score = (text: string) => {
    const t = norm(text)
    if (t === q) return 0
    if (t.startsWith(q)) return 1
    if (t.split(/\s+/).some((w) => w.startsWith(q))) return 2
    if (t.includes(q)) return 3
    return -1
  }

  const rank = <T,>(items: T[], texts: (item: T) => string[]) =>
    items
      .map((item) => {
        let best = -1
        for (const tx of texts(item)) {
          const s = score(tx)
          if (s !== -1 && (best === -1 || s < best)) best = s
        }
        return { item, s: best }
      })
      .filter((x) => x.s !== -1)
      .sort((a, b) => a.s - b.s)
      .map((x) => x.item)

  return {
    tracks: rank(catalog.tracks, (t) => [t.title, t.artistName, t.albumTitle]).slice(0, limit),
    artists: rank(catalog.artists, (a) => [a.name, ...a.genres, a.hometown]).slice(0, limit),
    albums: rank(catalog.albums, (a) => [a.title, a.artistName]).slice(0, limit),
    playlists: rank(catalog.playlists, (p) => [p.name, p.description]).slice(0, limit),
    podcasts: rank(catalog.podcasts, (p) => [p.title, p.host, p.genre]).slice(0, limit),
    genres: rank(catalog.genres, (g) => [g.name, g.tag]).slice(0, limit),
  }
}

/* ------------------------------------------------------------------ */
/* Recommendation helpers                                              */
/* ------------------------------------------------------------------ */
/**
 * Lightweight content-based recommender.
 * Ranks tracks by language / genre / artist affinity to a seed set.
 */
export function recommendTracks(seedTrackIds: string[], limit = 12, exclude: string[] = []): Track[] {
  const seeds = getTracks(seedTrackIds)
  if (!seeds.length) return trendingTracks.slice(0, limit)

  const langWeight = new Map<string, number>()
  const genreWeight = new Map<string, number>()
  const artistWeight = new Map<string, number>()

  for (const t of seeds) {
    langWeight.set(t.language, (langWeight.get(t.language) || 0) + 1)
    genreWeight.set(t.genre, (genreWeight.get(t.genre) || 0) + 1)
    artistWeight.set(t.artistId, (artistWeight.get(t.artistId) || 0) + 1)
  }

  const excluded = new Set([...seedTrackIds, ...exclude])
  return catalog.tracks
    .filter((t) => !excluded.has(t.id))
    .map((t) => ({
      t,
      score:
        (langWeight.get(t.language) || 0) * 3 +
        (genreWeight.get(t.genre) || 0) * 4 +
        (artistWeight.get(t.artistId) || 0) * 2 +
        Math.log10(t.plays + 1) * 0.4,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.t)
}

export function artistsForYou(seedTrackIds: string[], limit = 8): Artist[] {
  const tracks = getTracks(seedTrackIds)
  const langs = new Set(tracks.map((t) => t.language))
  const genres = new Set(tracks.map((t) => t.genre))
  return catalog.artists
    .map((a) => ({
      a,
      score:
        (langs.has(a.language) ? 3 : 0) +
        (genres.has(a.genre) ? 4 : 0) +
        Math.log10(a.monthlyListeners) * 0.5,
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a)
}

/* ------------------------------------------------------------------ */
/* Formatting helpers bound to data                                    */
/* ------------------------------------------------------------------ */
export function totalDuration(trackIds: string[]): number {
  return getTracks(trackIds).reduce((sum, t) => sum + t.duration, 0)
}

export function albumDuration(album: Album): number {
  return getTracks(album.trackIds).reduce((s, t) => s + t.duration, 0)
}

export { catalog }
export type { Catalog }

/* ------------------------------------------------------------------ */
/* Podcast helpers                                                     */
/* ------------------------------------------------------------------ */
export function episodeToTrack(ep: import('@/lib/types').PodcastEpisode, podcast: import('@/lib/types').Podcast): Track {
  return {
    id: ep.id,
    title: ep.title,
    artistId: podcast.id,
    artistName: podcast.host,
    albumId: podcast.id,
    albumTitle: podcast.title,
    coverArt: podcast.coverArt,
    duration: ep.duration,
    audioUrl: ep.audioUrl,
    trackNumber: ep.episodeNumber,
    disc: 1,
    year: Number(ep.date.slice(0, 4)),
    language: 'English',
    genre: 'podcast',
    plays: podcast.followers,
    explicit: false,
    hiRes: false,
    instrumental: true,
    lyrics: [],
  }
}

export function podcastToTracks(podcast: import('@/lib/types').Podcast): Track[] {
  return podcast.episodes.map((ep) => episodeToTrack(ep, podcast))
}
