'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  Clock,
  Download,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  Share2,
} from 'lucide-react'
import type { Album, Track } from '@/lib/types'
import { getTracks, albumsByArtist } from '@/lib/catalog-api'
import { usePlayer } from '@/lib/store/player'
import { useLibrary } from '@/lib/store/library'
import { useToast } from '@/lib/store/toast'
import { formatDuration, formatLongDuration, pluralize, cn } from '@/lib/utils'
import { TrackRow } from '@/components/cards/track-row'
import { AlbumCard } from '@/components/home/home-sections'
import { DetailHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import { Section, SeeAll } from '@/components/ui/primitives'
import { Carousel } from '@/components/layout/carousel'
import { EmptyState } from '@/components/ui/primitives'

export function AlbumView({ album }: { album: Album }) {
  const tracks = useMemo(() => getTracks(album.trackIds), [album.trackIds])
  const { playQueue, isPlaying, current, pause, resume } = usePlayer()
  const { isAlbumSaved, toggleSaveAlbum } = useLibrary()
  const { toast } = useToast()

  const isCurrentAlbum = !!current && tracks.some((t) => t.id === current.id)
  const playing = isCurrentAlbum && isPlaying
  const saved = isAlbumSaved(album.id)
  const total = tracks.reduce((s, t) => s + t.duration, 0)

  const handlePlay = () => {
    if (playing) pause()
    else if (isCurrentAlbum) resume()
    else playQueue(tracks, 0)
  }

  return (
    <>
      <DetailHeader
        cover={album.coverArt}
        eyebrow={`${album.type === 'ep' ? 'EP' : album.type === 'single' ? 'Single' : album.type === 'mixtape' ? 'Mixtape' : 'Album'}`}
        title={album.title}
        description={album.description}
        subtitle={
          <Link
            href={`/artist/${album.artistId}`}
            className="font-medium text-fg/90 underline-offset-4 hover:text-accent-soft hover:underline"
          >
            {album.artistName}
          </Link>
        }
        meta={
          <span className="flex flex-wrap items-center justify-center gap-x-1.5 md:justify-start">
            <span>{album.year}</span>
            <span>·</span>
            <span>{pluralize(album.trackCount, 'song')}</span>
            <span>·</span>
            <span>{formatLongDuration(total)}</span>
            <span>·</span>
            <span>{album.language}</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlay}
              aria-label={playing ? `Pause ${album.title}` : `Play ${album.title}`}
              className="rounded-full px-7"
            >
              {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-[1px] fill-current" />}
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                toggleSaveAlbum(album.id)
                toast(saved ? 'Removed from library' : 'Saved to library', album.title, 'music')
              }}
              className="rounded-full"
              aria-pressed={saved}
            >
              <Heart className={cn('h-4 w-4', saved && 'fill-current text-accent-soft')} />
              {saved ? 'Saved' : 'Save'}
            </Button>
            <Menu
              trigger={() => (
                <Button variant="outline" size="lg" className="rounded-full px-4" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              )}
            >
              {({ close }) => (
                <>
                  <MenuItem
                    icon={<Share2 className="h-3.5 w-3.5" />}
                    onClick={() => {
                      close()
                      toast('Link copied', 'Share this album with anyone.', 'success')
                    }}
                  >
                    Copy link
                  </MenuItem>
                  <MenuItem
                    icon={<Download className="h-3.5 w-3.5" />}
                    onClick={() => {
                      close()
                      toast('Download started', `${album.title} will be available offline.`, 'info')
                    }}
                  >
                    Download
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    icon={<Heart className="h-3.5 w-3.5" />}
                    onClick={() => {
                      toggleSaveAlbum(album.id)
                      close()
                    }}
                  >
                    {saved ? 'Remove from library' : 'Save to library'}
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        }
      />

      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        {/* table header */}
        <div className="mb-1 grid grid-cols-[1.75rem_minmax(0,1fr)_2.25rem_2.5rem_2.25rem] items-center gap-2 border-b border-line/[0.07] px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-dim md:gap-3">
          <span className="text-center">#</span>
          <span>Title</span>
          <span className="text-center">
            <Heart className="mx-auto h-3 w-3" />
          </span>
          <span className="text-right">
            <Clock className="ml-auto h-3 w-3" />
          </span>
          <span />
        </div>

        <ul>
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i} context={tracks} showAlbum={false} />
          ))}
        </ul>

        <p className="mt-4 px-3 text-[11px] text-dim">
          {album.year} · {album.language} · {album.type === 'ep' ? 'EP' : 'Album'} ·{' '}
          {formatLongDuration(total)}
        </p>

        <Section
          className="mt-14"
          title={`More by ${album.artistName}`}
          action={<SeeAll href={`/artist/${album.artistId}`} />}
        >
          <Carousel>
            {albumsByArtist(album.artistId)
              .filter((a) => a.id !== album.id)
              .map((a) => (
                <AlbumCard key={a.id} album={a} className="w-[9.5rem] sm:w-[10.5rem] lg:w-[11rem]" />
              ))}
          </Carousel>
        </Section>
      </div>
    </>
  )
}
