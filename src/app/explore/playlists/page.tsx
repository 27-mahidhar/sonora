import type { Metadata } from 'next'
import { PlaylistsListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'Playlists',
  description: 'Explore curated and algorithmic playlists on SONORA.',
}

export default function PlaylistsPage() {
  return <PlaylistsListing />
}
