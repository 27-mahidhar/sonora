'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Pause, Play, Radio } from 'lucide-react'
import type { Genre } from '@/lib/types'
import { getAlbum, getArtists, getTracks } from '@/lib/catalog-api'
import { usePlayer } from '@/lib/store/player'
import { pluralize } from '@/lib/utils'
import { DetailHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Section, SeeAll } from '@/components/ui/primitives'
import { Carousel } from '@/components/layout/carousel'
import { AlbumCard, ArtistCard } from '@/components/home/home-sections'
import { TrackRow } from '@/components/cards/track-row'

export function GenreView({ genre }: { genre: Genre }) {
  const { playQueue, isPlaying, current, pause, resume } = usePlayer()
  const tracks = useMemo(() => getTracks(genre.trackIds), [genre.trackIds])
  const artists = useMemo(() => getArtists(genre.artistIds), [genre.artistIds])
  const isCurrent = !!current && tracks.some((t) => t.id === current.id)
  const playing = isCurrent && isPlaying

  return (
    <>
      <DetailHeader
        cover={genre.coverArt}
        eyebrow="Genre"
        title={genre.name}
        description={genre.description}
        meta={
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 md:justify-start">
            <span>{pluralize(tracks.length, 'song')}</span>
            <span>·</span>
            <span>{pluralize(artists.length, 'artist')}</span>
          </span>
        }
        actions={
          <Button
            variant="primary"
            size="lg"
            onClick={() => (playing ? pause() : isCurrent ? resume() : playQueue(tracks, 0))}
            className="rounded-full px-7"
            aria-label={playing ? `Pause ${genre.name}` : `Play ${genre.name}`}
          >
            {playing ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 translate-x-[1px] fill-current" />
            )}
            {playing ? 'Pause' : 'Play'}
          </Button>
        }
      />

      <div className="space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
        <Section title="Top tracks" action={<SeeAll href={`/explore/songs`} />}>
          <ul>
            {tracks.slice(0, 10).map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} context={tracks} />
            ))}
          </ul>
        </Section>

        <Section title="Artists" action={<SeeAll href="/explore/artists" />}>
          <Carousel>
            {artists.map((a) => (
              <ArtistCard key={a.id} artist={a} className="w-[8.5rem] sm:w-[9.5rem] lg:w-[10rem]" />
            ))}
          </Carousel>
        </Section>

        <Section title="Albums" action={<SeeAll href="/explore/albums" />}>
          <Carousel>
            {getArtists(genre.artistIds)
              .flatMap((a) => a.albumIds)
              .slice(0, 14)
              .map((id) => {
                const album = getAlbum(id)
                return album ? (
                  <AlbumCard key={album.id} album={album} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
                ) : null
              })}
          </Carousel>
        </Section>

        <section className="rounded-2xl border border-line/[0.08] bg-elevated p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-soft">
              <Radio className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-serif text-xl text-fg">About {genre.name}</h3>
              <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
                {genre.description} Explore related genres to keep the mix interesting.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['pop', 'indie', 'electronic', 'folk', 'hip-hop'].map((g) => (
                  <Link
                    key={g}
                    href={`/genre/${g}`}
                    className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-medium text-muted transition-colors hover:bg-white/[0.1] hover:text-fg"
                  >
                    {g === 'hip-hop' ? 'Hip-Hop' : g.charAt(0).toUpperCase() + g.slice(1)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
