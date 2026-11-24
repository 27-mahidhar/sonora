import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchView } from '@/components/views/search-view'
import { CollectionSkeleton } from '@/components/views/collection-page'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search songs, artists, albums, playlists and podcasts on SONORA.',
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto h-14 max-w-2xl animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mt-10">
            <CollectionSkeleton count={8} />
          </div>
        </div>
      }
    >
      <SearchView />
    </Suspense>
  )
}
