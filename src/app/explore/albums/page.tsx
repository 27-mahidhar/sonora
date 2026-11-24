import type { Metadata } from 'next'
import { AlbumsListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'Albums',
  description: 'Browse albums, EPs and singles on SONORA.',
}

export default function AlbumsPage() {
  return <AlbumsListing />
}
