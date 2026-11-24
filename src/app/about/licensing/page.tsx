import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/layout/logo'

export const metadata: Metadata = {
  title: 'Licences & credits',
  description:
    'How SONORA sources its demo audio, and how to swap in a licensed streaming provider.',
}

const PROVIDERS = [
  {
    name: 'Kevin MacLeod (incompetech.com)',
    licence: 'CC BY 4.0',
    note: 'Licensed under a Creative Commons Attribution 4.0 International Licence. You are free to use, remix and build upon this work for commercial purposes, provided you credit the original author.',
    url: 'https://incompetech.com/',
  },
  {
    name: 'SoundHelix',
    licence: 'Free for testing & demo use',
    note: 'Generated test tracks used for streaming and seek-bar demonstration.',
    url: 'https://www.soundhelix.com/',
  },
]

export default function LicensingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
        Legal
      </p>
      <h1 className="display text-[clamp(2.2rem,5vw,3.4rem)] text-fg">Licences &amp; credits</h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
        SONORA is a demonstration platform. Nothing here scrapes or re-broadcasts audio from
        Spotify, Apple Music or YouTube. Every track in the catalogue is a royalty-free or
        Creative Commons recording, and all artwork, lyrics and artist biographies are original
        fictional content created for this demo.
      </p>

      <div className="mt-10 space-y-6">
        {PROVIDERS.map((p) => (
          <div key={p.name} className="hairline rounded-2xl bg-elevated p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-fg">{p.name}</h2>
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-soft">
                {p.licence}
              </span>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{p.note}</p>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent-soft hover:underline"
            >
              Visit source ↗
            </a>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-serif text-2xl text-fg">Swapping in a licensed provider</h2>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
        Playback is intentionally isolated behind a single module so a commercial provider can be
        dropped in without touching the UI. The catalogue exposes a plain <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-fg">audioUrl</code> per
        track; replace it with a resolver that returns a short-lived stream URL from your
        provider, and the player will follow.
      </p>

      <pre className="mt-5 overflow-x-auto rounded-2xl border border-line/[0.08] bg-base-soft p-5 font-mono text-[11.5px] leading-relaxed text-muted">
{`// lib/data/stream-provider.ts
export interface StreamProvider {
  resolve(track: Track): Promise<string>
}

// Local (demo) — files are already streamable
export const demoProvider: StreamProvider = {
  resolve: async (t) => t.audioUrl,
}

// Example: licensed CDN with signed URLs
export const licensedProvider: StreamProvider = {
  resolve: async (t) => {
    const res = await fetch(\`/api/stream/\${t.id}\`)
    const { url } = await res.json()
    return url
  },
}`}
      </pre>

      <h2 className="mt-12 font-serif text-2xl text-fg">Attribution</h2>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
        Tracks by Kevin MacLeod are licensed under CC BY 4.0. Artist names, biographies, album
        titles, lyrics and cover artwork in this catalogue are fictional and were generated for
        demonstration purposes. Any resemblance to real artists is coincidental.
      </p>

      <div className="mt-10 border-t border-line/[0.07] pt-6">
        <Link href="/" className="text-[12.5px] text-accent-soft hover:underline">
          ← Back to SONORA
        </Link>
      </div>
    </div>
  )
}
