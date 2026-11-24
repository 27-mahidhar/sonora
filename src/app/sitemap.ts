import type { MetadataRoute } from 'next'
import { catalog } from '@/data/catalog'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonora.app'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/search',
    '/explore',
    '/explore/songs',
    '/explore/albums',
    '/explore/artists',
    '/explore/playlists',
    '/explore/genres',
    '/explore/podcasts',
    '/explore/new-releases',
    '/explore/trending',
    '/library',
    '/settings',
    '/signin',
    '/signup',
    '/about/licensing',
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }))

  const albums = catalog.albums.map((a) => ({
    url: `${BASE}/album/${a.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const artists = catalog.artists.map((a) => ({
    url: `${BASE}/artist/${a.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const playlists = catalog.playlists.map((p) => ({
    url: `${BASE}/playlist/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  const genres = catalog.genres.map((g) => ({
    url: `${BASE}/genre/${g.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  const podcasts = catalog.podcasts.map((p) => ({
    url: `${BASE}/podcast/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticRoutes, ...albums, ...artists, ...playlists, ...genres, ...podcasts]
}
