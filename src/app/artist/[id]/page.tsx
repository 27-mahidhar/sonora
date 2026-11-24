import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { catalog } from '@/data/catalog'
import { getArtist } from '@/lib/catalog-api'
import { ArtistView } from '@/components/views/artist-view'

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return catalog.artists.map((a) => ({ id: a.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const artist = getArtist(params.id)
  if (!artist) return { title: 'Artist not found' }
  return {
    title: artist.name,
    description: artist.bio,
    openGraph: {
      title: `${artist.name} — SONORA`,
      description: artist.bio.slice(0, 200),
      images: [{ url: artist.image }],
      type: 'profile',
    },
  }
}

export default function ArtistPage({ params }: PageProps) {
  const artist = getArtist(params.id)
  if (!artist) notFound()
  return <ArtistView artist={artist} />
}
