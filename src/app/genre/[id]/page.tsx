import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { catalog } from '@/data/catalog'
import { getGenre } from '@/lib/catalog-api'
import { GenreView } from '@/components/views/genre-view'

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return catalog.genres.map((g) => ({ id: g.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const genre = getGenre(params.id)
  if (!genre) return { title: 'Genre not found' }
  return {
    title: `${genre.name} music`,
    description: genre.description,
    openGraph: {
      title: `${genre.name} — SONORA`,
      description: genre.description,
      images: [{ url: genre.coverArt }],
    },
  }
}

export default function GenrePage({ params }: PageProps) {
  const genre = getGenre(params.id)
  if (!genre) notFound()
  return <GenreView genre={genre} />
}
