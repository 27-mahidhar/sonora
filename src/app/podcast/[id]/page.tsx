import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { catalog } from '@/data/catalog'
import { getPodcast } from '@/lib/catalog-api'
import { PodcastView } from '@/components/views/podcast-view'

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return catalog.podcasts.map((p) => ({ id: p.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const podcast = getPodcast(params.id)
  if (!podcast) return { title: 'Podcast not found' }
  return {
    title: podcast.title,
    description: podcast.description,
    openGraph: {
      title: `${podcast.title} — SONORA`,
      description: podcast.description,
      images: [{ url: podcast.coverArt }],
    },
  }
}

export default function PodcastPage({ params }: PageProps) {
  const podcast = getPodcast(params.id)
  if (!podcast) notFound()
  return <PodcastView podcast={podcast} />
}
