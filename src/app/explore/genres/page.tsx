import type { Metadata } from 'next'
import { GenresListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'Genres',
  description: 'Browse SONORA by genre — pop, indie, electronic, hip-hop, R&B and more.',
}

export default function GenresPage() {
  return <GenresListing />
}
