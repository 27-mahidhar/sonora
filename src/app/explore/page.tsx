import type { Metadata } from 'next'
import { ExploreView } from '@/components/views/explore-view'

export const metadata: Metadata = {
  title: 'Explore',
  description:
    'Browse songs, albums, artists, playlists and podcasts across Telugu, Hindi, English and Tamil music.',
}

export default function ExplorePage() {
  return <ExploreView />
}
