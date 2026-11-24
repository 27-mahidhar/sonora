import Link from 'next/link'
import { Logo } from './logo'

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Explore', href: '/explore' },
      { label: 'New releases', href: '/explore/new-releases' },
      { label: 'Trending', href: '/explore/trending' },
    ],
  },
  {
    title: 'Music',
    links: [
      { label: 'Songs', href: '/explore/songs' },
      { label: 'Albums', href: '/explore/albums' },
      { label: 'Artists', href: '/explore/artists' },
      { label: 'Playlists', href: '/explore/playlists' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Your Library', href: '/library' },
      { label: 'Settings', href: '/settings' },
      { label: 'Licences', href: '/about/licensing' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line/[0.07] pt-8">
      <div className="grid gap-8 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-[16rem] text-[12px] leading-relaxed text-dim">
            A premium streaming home for Telugu, Hindi, English and Tamil music. Built for people
            who actually listen.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-dim">
              {col.title}
            </p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[12.5px] text-muted transition-colors hover:text-fg"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start justify-between gap-2 border-t border-line/[0.06] py-5 sm:flex-row sm:items-center">
        <p className="text-[11.5px] text-dim">
          © {new Date().getFullYear()} SONORA. Demo audio is royalty-free (CC-BY).
        </p>
        <p className="text-[11.5px] text-dim">
          Made with care in India ·{' '}
          <Link href="/about/licensing" className="underline-offset-2 hover:text-fg hover:underline">
            licensing
          </Link>
        </p>
      </div>
    </footer>
  )
}
