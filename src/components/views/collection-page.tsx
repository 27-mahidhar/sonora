'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton, EmptyState } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'

export interface FilterGroup<T> {
  id: string
  label: string
  options: { id: string; label: string }[]
  predicate: (item: T, value: string) => boolean
}

export interface SortOption<T> {
  id: string
  label: string
  compare: (a: T, b: T) => number
}

interface CollectionPageProps<T> {
  eyebrow?: string
  title: string
  description?: string
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  filters?: FilterGroup<T>[]
  sortOptions?: SortOption<T>[]
  searchPredicate?: (item: T, q: string) => boolean
  searchPlaceholder?: string
  layout?: 'grid' | 'list'
  gridClassName?: string
  emptyTitle?: string
  emptyDescription?: string
  /** show a "no results" state instead of the generic empty state */
  hideSearch?: boolean
}

export function CollectionPage<T>({
  eyebrow,
  title,
  description,
  items,
  renderItem,
  filters = [],
  sortOptions,
  searchPredicate,
  searchPlaceholder = 'Filter by name',
  layout = 'grid',
  gridClassName = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  hideSearch = false,
}: CollectionPageProps<T>) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<string>(sortOptions?.[0]?.id ?? '')

  const filtered = useMemo(() => {
    let out = items
    if (query.trim() && searchPredicate) {
      const q = query.trim().toLowerCase()
      out = out.filter((i) => searchPredicate(i, q))
    }
    for (const f of filters) {
      const v = active[f.id]
      if (!v || v === 'all') continue
      out = out.filter((i) => f.predicate(i, v))
    }
    if (sortOptions?.length) {
      const opt = sortOptions.find((o) => o.id === sort)
      if (opt) out = [...out].sort(opt.compare)
    }
    return out
  }, [items, query, active, sort, filters, sortOptions, searchPredicate])

  const hasAnyFilter = query.trim().length > 0 || Object.values(active).some((v) => v && v !== 'all')

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        {eyebrow ? (
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="display text-balance text-[clamp(2.2rem,5.5vw,3.8rem)] text-fg">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">{description}</p>
        ) : null}
        <p className="mt-2 text-[11.5px] text-dim">{items.length} results</p>
      </header>

      {/* toolbar */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 bg-base/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {!hideSearch ? (
            <div className="relative order-none w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 w-full rounded-full border border-line/10 bg-elevated pl-10 pr-4 text-[12.5px] text-fg outline-none transition-colors placeholder:text-dim focus:border-accent/45"
              />
            </div>
          ) : null}

          {filters.map((f) => (
            <div key={f.id} className="flex items-center gap-1.5">
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-dim md:block">
                {f.label}
              </span>
              <select
                value={active[f.id] ?? 'all'}
                onChange={(e) => setActive((p) => ({ ...p, [f.id]: e.target.value }))}
                aria-label={f.label}
                className="h-9 cursor-pointer appearance-none rounded-full border border-line/10 bg-elevated px-3 pr-8 text-[12px] text-muted outline-none transition-colors hover:text-fg focus:border-accent/45"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                }}
              >
                <option value="all">All</option>
                {f.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {sortOptions?.length ? (
            <div className="ml-auto flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-dim" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort order"
                className="h-9 cursor-pointer appearance-none rounded-full border border-line/10 bg-elevated px-3 pr-8 text-[12px] text-muted outline-none transition-colors hover:text-fg focus:border-accent/45"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                }}
              >
                {sortOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {hasAnyFilter ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setActive({})
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={hasAnyFilter ? 'No matches' : emptyTitle}
          description={
            hasAnyFilter
              ? 'Try a different search term or clear your filters.'
              : emptyDescription
          }
          action={
            hasAnyFilter ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setActive({})
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : layout === 'grid' ? (
        <div className={gridClassName}>{filtered.map((item, i) => renderItem(item, i))}</div>
      ) : (
        <ul>{filtered.map((item, i) => renderItem(item, i))}</ul>
      )}
    </div>
  )
}

export function CollectionSkeleton({
  count = 12,
  circle = false,
}: {
  count?: number
  circle?: boolean
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-12 w-72" />
      <Skeleton className="mb-8 h-3 w-96" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-2">
            <Skeleton className={cn('aspect-square w-full', circle ? 'rounded-full' : 'rounded-xl')} />
            <Skeleton className="mt-3 h-3 w-4/5" />
            <Skeleton className="mt-2 h-2.5 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
