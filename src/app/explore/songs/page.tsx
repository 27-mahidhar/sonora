import type { Metadata } from 'next'
import { SongsListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'Songs',
  description: 'Explore every song on SONORA across Telugu, Hindi, English and Tamil.',
}

export default function SongsPage() {
  return <SongsListing />
}
