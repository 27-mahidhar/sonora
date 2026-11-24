import type { Metadata } from 'next'
import { ArtistsListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'Artists',
  description: 'Discover artists across Telugu, Hindi, English and Tamil music on SONORA.',
}

export default function ArtistsPage() {
  return <ArtistsListing />
}
