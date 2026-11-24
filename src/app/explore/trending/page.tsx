import type { Metadata } from 'next'
import { TrendingListing } from '@/components/views/listing-views'

export const metadata: Metadata = {
  title: 'Trending',
  description: 'The most-played tracks on SONORA right now.',
}

export default function TrendingPage() {
  return <TrendingListing />
}
