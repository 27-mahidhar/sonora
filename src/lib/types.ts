/* ------------------------------------------------------------------ */
/* SONORA — shared domain types                                       */
/* ------------------------------------------------------------------ */

export type Language = 'Telugu' | 'Hindi' | 'English' | 'Tamil'

export interface LyricLine {
  /** start time in seconds */
  t: number
  text: string
}

export interface Track {
  id: string
  title: string
  artistId: string
  artistName: string
  albumId: string
  albumTitle: string
  coverArt: string
  /** seconds */
  duration: number
  audioUrl: string
  trackNumber: number
  disc: number
  year: number
  language: Language
  genre: string
  plays: number
  explicit: boolean
  hiRes: boolean
  instrumental: boolean
  lyrics: LyricLine[]
}

export type AlbumType = 'album' | 'ep' | 'single' | 'mixtape'

export interface Album {
  id: string
  title: string
  artistId: string
  artistName: string
  coverArt: string
  year: number
  type: AlbumType
  trackIds: string[]
  trackCount: number
  duration: number
  genre: string
  language: Language
  plays: number
  description: string
}

export interface Artist {
  id: string
  name: string
  image: string
  bio: string
  language: Language
  genre: string
  genres: string[]
  hometown: string
  monthlyListeners: number
  followers: number
  debutYear: number
  verified: boolean
  albumIds: string[]
  trackIds: string[]
  relatedIds: string[]
}

export interface Playlist {
  id: string
  name: string
  description: string
  curator: string
  mood: string
  system: boolean
  coverArt: string
  trackIds: string[]
  followers: number
  gradient: string
}

export interface PodcastEpisode {
  id: string
  title: string
  description: string
  duration: number
  audioUrl: string
  date: string
  episodeNumber: number
}

export interface Podcast {
  id: string
  title: string
  host: string
  genre: string
  description: string
  coverArt: string
  followers: number
  episodes: PodcastEpisode[]
}

export interface Genre {
  id: string
  name: string
  tag: string
  description: string
  gradient: string
  coverArt: string
  trackIds: string[]
  artistIds: string[]
  albumIds: string[]
}

export interface Catalog {
  artists: Artist[]
  albums: Album[]
  tracks: Track[]
  playlists: Playlist[]
  podcasts: Podcast[]
  genres: Genre[]
  generatedAt: string
}

/* ------------------------------------------------------------------ */
/* Runtime (user) models                                              */
/* ------------------------------------------------------------------ */

export interface UserPlaylist {
  id: string
  name: string
  description: string
  trackIds: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
  ownerId: string
  coverArt?: string
}

export interface HistoryEntry {
  trackId: string
  playedAt: string
  progress: number
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  createdAt: string
}

export interface LibraryState {
  likedTrackIds: string[]
  followedArtistIds: string[]
  savedAlbumIds: string[]
  savedPlaylistIds: string[]
  playlists: UserPlaylist[]
  history: HistoryEntry[]
}
