'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  BadgeCheck,
  Pause,
  Play,
  UserCheck,
  UserPlus,
  Share2,
} from 'lucide-react'
import type { Artist } from '@/lib/types'
import {
  albumsByArtist,
  artistTracks,
  relatedArtists,
  getTracks,
} from '@/lib/catalog-api'
import { usePlayer } from '@/lib/store/player'
import { useLibrary } from '@/lib/store/library'
import { useToast } from '@/lib/store/toast'
import { formatCompact, formatFull, pluralize, cn } from '@/lib/utils'
import { TrackRow } from '@/components/cards/track-row'
import { AlbumCard, ArtistCard } from '@/components/home/home-sections'
import { DetailHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Section, SeeAll, Badge } from '@/components/ui/primitives'
import { Carousel } from '@/components/layout/carousel'

export function ArtistView({ artist }: { artist: Artist }) {
  const { playQueue, isPlaying, current, pause, resume } = usePlayer()
  const { isFollowing, toggleFollow } = useLibrary()
  const { toast } = useToast()

  const popular = useMemo(() => artistTracks(artist.id).slice(0, 5), [artist.id])
  const allTracks = useMemo(() => artistTracks(artist.id), [artist.id])
  const albums = useMemo(() => albumsByArtist(artist.id), [artist.id])
  const related = useMemo(() => relatedArtists(artist), [artist])

  const isCurrent = !!current && allTracks.some((t) => t.id === current.id)
  const playing = isCurrent && isPlaying
  const following = isFollowing(artist.id)

  const handlePlay = () => {
    if (playing) pause()
    else if (isCurrent) resume()
    else playQueue(allTracks, 0)
  }

  return (
    <>
      <DetailHeader
        cover={artist.image}
        coverShape="circle"
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5 text-accent-soft" />
            Verified artist
          </span>
        }
        title={artist.name}
        meta={
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 md:justify-start">
            <span className="font-medium text-fg/80">
              {formatCompact(artist.monthlyListeners)} monthly listeners
            </span>
            <span>·</span>
            <span>{artist.hometown}</span>
            <span>·</span>
            <span>{artist.genres.slice(0, 2).join(' · ')}</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlay}
              aria-label={playing ? `Pause ${artist.name}` : `Play ${artist.name}`}
              className="rounded-full px-7"
            >
              {playing ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px] fill-current" />
              )}
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant={following ? 'secondary' : 'outline'}
              size="lg"
              onClick={() => {
                toggleFollow(artist.id)
                toast(
                  following ? 'Unfollowed artist' : 'Following artist',
                  artist.name,
                  following ? 'info' : 'success'
                )
              }}
              className={cn('rounded-full', following && 'text-accent-soft')}
              aria-pressed={following}
            >
              {following ? (
                <UserCheck className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {following ? 'Following' : 'Follow'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => toast('Link copied', `Share ${artist.name} with anyone.`, 'success')}
              className="rounded-full px-4"
              aria-label="Share artist"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
        {/* popular */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="font-serif text-[1.6rem] leading-none text-fg sm:text-[1.9rem]">
              Popular
            </h2>
            <Badge variant="outline">Last 12 months</Badge>
          </div>
          <ul>
            {popular.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} context={allTracks} showAlbum />
            ))}
          </ul>
        </section>

        {/* albums */}
        <Section
          title="Albums & singles"
          action={<SeeAll href={`/explore/albums?artist=${artist.id}`} />}
        >
          {albums.length ? (
            <Carousel>
              {albums.map((a) => (
                <AlbumCard key={a.id} album={a} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
              ))}
            </Carousel>
          ) : (
            <p className="text-[13px] text-dim">No releases yet.</p>
          )}
        </Section>

        {/* bio + stats */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <h2 className="mb-3 font-serif text-[1.6rem] leading-none text-fg sm:text-[1.9rem]">
              About
            </h2>
            <p className="max-w-2xl text-[13.5px] leading-[1.75] text-muted">{artist.bio}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {artist.genres.map((g) => (
                <Link
                  key={g}
                  href={`/explore/genres`}
                  className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-medium text-muted transition-colors hover:bg-white/[0.1] hover:text-fg"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
          <div className="hairline rounded-2xl bg-elevated p-5">
            <h3 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-dim">
              Artist stats
            </h3>
            <dl className="space-y-3">
              <Stat label="Monthly listeners" value={formatFull(artist.monthlyListeners)} />
              <Stat label="Followers" value={formatFull(artist.followers)} />
              <Stat label="Debut year" value={String(artist.debutYear)} />
              <Stat label="Releases" value={pluralize(albums.length, 'release')} />
              <Stat label="Hometown" value={artist.hometown} />
              <Stat label="Languages" value={artist.language} />
            </dl>
          </div>
        </section>

        {/* related */}
        <Section
          title="Fans also like"
          description="Artists with a similar sound."
          action={<SeeAll href="/explore/artists" />}
        >
          <Carousel>
            {related.map((r) => (
              <ArtistCard key={r.id} artist={r} className="w-[8.5rem] sm:w-[9.5rem] lg:w-[10rem]" />
            ))}
          </Carousel>
        </Section>

        {/* all tracks */}
        <Section title="Discography" description={`Every track by ${artist.name} on SONORA.`}>
          <ul>
            {allTracks.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} context={allTracks} />
            ))}
          </ul>
        </Section>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/[0.06] pb-2.5 last:border-0">
      <dt className="text-[12px] text-dim">{label}</dt>
      <dd className="text-[12.5px] font-medium tabular-nums text-fg">{value}</dd>
    </div>
  )
}
