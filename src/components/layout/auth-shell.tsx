'use client'

import Link from 'next/link'
import { Logo } from './logo'
import { CoverArt } from '@/components/cards/cover-art'

const COLLAGE = [
  '/art/gen/cover-noor.svg',
  '/art/gen/cover-vennello.svg',
  '/art/gen/cover-midnight-drive.svg',
  '/art/gen/cover-aarzoo.svg',
  '/art/gen/cover-kanmani.svg',
  '/art/gen/cover-afterglow.svg',
]

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* visual side */}
      <div className="relative hidden overflow-hidden bg-base-soft lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute -left-32 top-0 h-[36rem] w-[36rem] rounded-full bg-accent/25 blur-[120px]" />
          <div className="absolute -right-24 bottom-0 h-[30rem] w-[30rem] rounded-full bg-indigo-600/20 blur-[110px]" />
        </div>

        <div className="relative p-10">
          <Logo />
        </div>

        <div className="relative px-10">
          <blockquote className="display max-w-md text-balance text-[clamp(2rem,3.6vw,3.1rem)] leading-[1.05] text-fg">
            “Music is the shorthand of emotion. Everything else is just details.”
          </blockquote>
          <p className="mt-4 text-[12px] uppercase tracking-[0.18em] text-dim">
            The SONORA editorial desk
          </p>
        </div>

        <div className="relative px-10 pb-10">
          <div className="flex -space-x-3">
            {COLLAGE.map((src, i) => (
              <div
                key={src}
                className="art art-shadow h-14 w-14 overflow-hidden rounded-xl"
                style={{ transform: `rotate(${(i - 2.5) * 3}deg) translateY(${Math.abs(i - 2.5) * 3}px)` }}
              >
                <CoverArt src={src} alt="" className="h-full w-full" rounded="rounded-xl" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11.5px] text-dim">
            270 tracks · 16 artists · 4 languages · all royalty-free
          </p>
        </div>
      </div>

      {/* form side */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mb-10 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="display text-[2.4rem] leading-none text-fg">{title}</h1>
          {subtitle ? <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-[12px] text-dim">
            By continuing you agree to SONORA’s terms and privacy policy.
          </p>
          <p className="mt-6 text-center text-[12px] text-dim">
            <Link href="/" className="underline-offset-4 hover:text-fg hover:underline">
                  ← Back to SONORA
                </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
