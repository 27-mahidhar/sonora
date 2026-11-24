import type { Metadata } from 'next'
import {
  HeroBanner,
  Greeting,
  QuickPicks,
  MadeForYou,
  TrendingWorldwide,
  LanguageGrid,
  NewReleasesSection,
  RecommendedArtistsSection,
  PopularPlaylistsSection,
} from '@/components/home/home-sections'
import { GenreStrip } from '@/components/home/genre-strip'
import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = {
  title: 'SONORA — Music that stays with you',
  description:
    'Stream Telugu, Hindi, English and Tamil music on SONORA. Curated playlists, lossless-quality listening and synced lyrics.',
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-12 px-4 pb-16 pt-4 sm:px-6 lg:px-8 lg:pt-6">
      <HeroBanner />

      <div className="space-y-4">
        <Greeting />
        <QuickPicks />
      </div>

      <GenreStrip />
      <MadeForYou />
      <TrendingWorldwide />
      <LanguageGrid />
      <NewReleasesSection />
      <RecommendedArtistsSection />
      <PopularPlaylistsSection />

      <SiteFooter />
    </div>
  )
}
