import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { AppShell } from '@/components/layout/app-shell'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sonora.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SONORA — Music that stays with you',
    template: '%s · SONORA',
  },
  description:
    'Stream Telugu, Hindi, English and Tamil music on SONORA. Curated playlists, lossless-quality listening, synced lyrics and a player built for people who actually listen.',
  applicationName: 'SONORA',
  keywords: [
    'music streaming',
    'Telugu songs',
    'Hindi songs',
    'Tamil songs',
    'English songs',
    'playlists',
    'SONORA',
  ],
  authors: [{ name: 'SONORA' }],
  creator: 'SONORA',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'SONORA',
    title: 'SONORA — Music that stays with you',
    description:
      'Stream Telugu, Hindi, English and Tamil music. Curated playlists, synced lyrics and a player built for listening.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'SONORA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SONORA — Music that stays with you',
    description:
      'Stream Telugu, Hindi, English and Tamil music. Curated playlists, synced lyrics and a player built for listening.',
    images: ['/og.jpg'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
    { media: '(prefers-color-scheme: light)', color: '#fafafb' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

const themeInit = `(function(){try{var t=localStorage.getItem('sonora.theme');var d=t?t==='dark':true;var c=d?'dark':'light';document.documentElement.classList.add(c);document.documentElement.style.colorScheme=c;}catch(e){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}})();`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SONORA',
  url: SITE_URL,
  description:
    'A premium music streaming platform for Telugu, Hindi, English and Tamil music.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-base text-fg antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
