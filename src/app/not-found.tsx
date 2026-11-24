import Link from 'next/link'
import { Logo } from '@/components/layout/logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-12 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-accent-soft">
        Error 404
      </p>
      <h1 className="display mt-3 max-w-lg text-balance text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.95] text-fg">
        This track isn&apos;t on the record.
      </h1>
      <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-muted">
        The page you were looking for has been moved, renamed, or never existed. The music,
        however, is still playing.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-accent px-7 py-3 text-[14px] font-medium text-white shadow-glow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-soft hover:shadow-glow"
      >
        Back to home
      </Link>
    </div>
  )
}
