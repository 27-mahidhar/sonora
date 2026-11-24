'use client'

import Link from 'next/link'
import { catalog } from '@/lib/catalog-api'
import { cn } from '@/lib/utils'

const TINTS = [
  'from-violet-600 to-violet-950',
  'from-rose-500 to-rose-950',
  'from-amber-500 to-amber-900',
  'from-teal-500 to-teal-950',
  'from-indigo-600 to-indigo-950',
  'from-fuchsia-600 to-fuchsia-950',
  'from-cyan-500 to-cyan-950',
  'from-emerald-600 to-emerald-950',
  'from-orange-500 to-orange-900',
  'from-sky-500 to-sky-950',
  'from-lime-500 to-lime-900',
  'from-purple-600 to-purple-950',
]

export function GenreStrip() {
  const genres = catalog.genres.slice(0, 8)

  return (
    <section aria-label="Browse genres" className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-serif text-[1.5rem] leading-none text-fg sm:text-[1.85rem]">
          Browse by genre
        </h2>
        <Link
          href="/explore/genres"
          className="text-[12px] font-medium uppercase tracking-[0.14em] text-dim transition-colors hover:text-fg"
        >
          All genres →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {genres.map((g, i) => (
          <Link
            key={g.id}
            href={`/genre/${g.id}`}
            className={cn(
              'group relative flex aspect-[1.6] items-end overflow-hidden rounded-xl bg-gradient-to-br p-3.5',
              'transition-transform duration-300 ease-snap hover:-translate-y-0.5',
              TINTS[i % TINTS.length]
            )}
          >
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.22),transparent_58%)] opacity-60 transition-opacity duration-300 group-hover:opacity-90" />
            <span className="relative font-serif text-[1.15rem] leading-none text-white drop-shadow-sm sm:text-[1.3rem]">
              {g.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
