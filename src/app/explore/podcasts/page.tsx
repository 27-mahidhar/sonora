import type { Metadata } from 'next'
import { PodcastsListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'Podcasts',
  description: 'Listen to podcasts about music, production and craft on SONORA.',
}

export default function PodcastsPage() {
  return <PodcastsListing />
}
