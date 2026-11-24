import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { catalog } from '@/data/catalog'
import { getPlaylist } from '@/lib/catalog-api'
import { PlaylistView } from '@/components/views/playlist-view'
import { UserPlaylistGate } from '@/components/views/playlist-gate'

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return catalog.playlists.map((p) => ({ id: p.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const playlist = getPlaylist(params.id)
  if (!playlist) return { title: 'Playlist not found' }
  return {
    title: playlist.name,
    description: playlist.description,
    openGraph: {
      title: `${playlist.name} — SONORA`,
      description: playlist.description,
      images: [{ url: playlist.coverArt }],
      type: 'music.playlist',
    },
  }
}

export default function PlaylistPage({ params }: PageProps) {
  const playlist = getPlaylist(params.id)
  // User-created playlists live in local/Supabase storage, so they resolve
  // client-side. System playlists are fully static.
  if (playlist) return <PlaylistView playlist={playlist} isOwned={false} />
  return <UserPlaylistGate id={params.id} />
}
