import type { Metadata } from 'next'
import { NewReleasesListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'New releases',
  description: 'The newest albums, EPs and singles on SONORA.',
}

export default function NewReleasesPage() {
  return <NewReleasesListing />
}
