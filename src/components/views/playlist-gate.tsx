'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPlaylist } from '@/lib/catalog-api'
import { useLibrary } from '@/lib/store/library'
import { PlaylistView } from './playlist-view'
import { Skeleton } from '@/components/ui/primitives'
import { EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'

/**
 * Resolves a user-created playlist (stored in the library) by id.
 * System playlists are handled statically by the server page.
 */
export function UserPlaylistGate({ id }: { id: string }) {
  const { userPlaylists, ready } = useLibrary()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])

  if (!hydrated || !ready) {
    return (
      <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-end">
          <Skeleton className="h-56 w-56 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    )
  }

  const playlist = userPlaylists.find((p) => p.id === id)
  if (!playlist) {
    return (
      <div className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Playlist not found"
          description="It may have been deleted, or it belongs to another account."
          action={
            <Button variant="primary" size="sm" onClick={() => router.push('/library?tab=playlists')}>
              Back to library
            </Button>
          }
        />
      </div>
    )
  }

  return <PlaylistView playlist={playlist} isOwned />
}
