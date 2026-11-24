import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LibraryView } from '@/components/views/library-view'
import { CollectionSkeleton } from '@/components/views/collection-page'

export const metadata: Metadata = {
  title: 'Your Library',
  description: 'Your playlists, followed artists, saved albums and liked songs on SONORA.',
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
          <div className="h-12 w-72 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="mt-8">
            <CollectionSkeleton count={10} />
          </div>
        </div>
      }
    >
      <LibraryView />
    </Suspense>
  )
}
