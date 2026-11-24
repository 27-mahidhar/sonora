import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { catalog } from '@/data/catalog'
import { getAlbum } from '@/lib/catalog-api'
import { AlbumView } from '@/components/views/album-view'

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return catalog.albums.map((a) => ({ id: a.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const album = getAlbum(params.id)
  if (!album) return { title: 'Album not found' }
  return {
    title: `${album.title} — ${album.artistName}`,
    description: `${album.description} Stream ${album.trackCount} songs on SONORA.`,
    openGraph: {
      title: `${album.title} — ${album.artistName}`,
      description: album.description,
      images: [{ url: album.coverArt }],
      type: 'music.album',
    },
  }
}

export default function AlbumPage({ params }: PageProps) {
  const album = getAlbum(params.id)
  if (!album) notFound()
  return <AlbumView album={album} />
}
