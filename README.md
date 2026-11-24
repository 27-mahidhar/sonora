# SONORA

A production-quality music streaming web app — the best of Spotify, Apple Music and YouTube Music, with its own identity.

Dark-first UI built on **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase**, with a fully working persistent player, synced lyrics, a real queue, and a library that survives reloads.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

That's it. SONORA runs in **demo mode** out of the box — no keys, no database. Everything (auth, library, playlists, listening history) falls back to `localStorage` so the whole product is usable immediately.

### Optional: connect Supabase

```bash
cp .env.local.example .env.local   # then fill in the two values
```

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key |

Then apply the schema:

```bash
supabase db push        # or paste supabase/migrations/0001_init.sql into the SQL editor
```

The app detects a configured project at runtime and switches every store from the local adapter to the Supabase adapter — no code changes.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (108 static pages) |
| `npm start` | Serve the production build |
| `npm run lint` | Next.js ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run catalog` | Regenerate `src/data/catalog.ts` + artwork from `scripts/build-catalog.mjs` |
| `npm run art` | Regenerate artwork only |

---

## What's inside

### Player
- Persistent bottom bar — artwork, title/artist, like, play/pause, prev/next, shuffle, repeat (off → all → one), seek, volume + mute, queue, lyrics, full screen.
- **Real audio playback.** Every track resolves to a royalty-free / CC-licensed stream (SoundHelix + Kevin MacLeod, CC-BY 4.0). If a source is unreachable the player transparently falls back to a known-good stream instead of dead-ending.
- **Queue management** — play next, add to queue, remove, clear, reorder.
- **Synced lyrics** — highlight tracks the active line in both the side panel and the full-screen player.
- **Full-screen player** with cover-derived ambient glow, animated artwork and a queue/lyrics toggle.
- **Keyboard shortcuts** — <kbd>Space</kbd> play/pause · <kbd>←</kbd>/<kbd>→</kbd> seek ±5s · <kbd>Shift</kbd>+<kbd>←</kbd>/<kbd>→</kbd> prev/next · <kbd>↑</kbd>/<kbd>↓</kbd> volume · <kbd>M</kbd> mute · <kbd>N</kbd>/<kbd>P</kbd> next/prev · <kbd>S</kbd> shuffle · <kbd>R</kbd> repeat · <kbd>L</kbd> like · <kbd>F</kbd> full screen · <kbd>Q</kbd> queue · <kbd>Y</kbd> lyrics · <kbd>Esc</kbd> close · <kbd>/</kbd> search.

### Pages
Home (personalised greeting, featured hero, quick picks, Made for You, Trending worldwide, Telugu / Hindi / English / Tamil hits, new releases, recommended artists, popular playlists, genre strip) · Explore · Songs · Albums · Artists · Playlists · Genres · Podcasts · New releases · Trending · Album · Artist · Playlist · Genre · Podcast · Search · Library · Settings · Sign in · Sign up · Licensing · 404.

### Library
Liked songs, followed artists, saved albums and playlists, recently played, and **user playlists** — create, rename, re-describe, add/remove tracks, reorder, delete.

### Backend
`supabase/migrations/0001_init.sql` creates 12 tables (catalogue: `artists`, `albums`, `tracks`, `playlists`, `playlist_tracks`; user: `profiles`, `liked_tracks`, `followed_artists`, `saved_albums`, `saved_playlists`, `listening_history`, `user_settings`) with **row-level security** on every table:

- catalogue tables are public read-only,
- user tables are scoped to `auth.uid()`,
- `playlist_tracks` writes are guarded by a parent-playlist `EXISTS` subquery,
- `handle_new_user()` seeds a profile + settings row on signup.

### Music integration
Nothing is scraped. Every track points at a licensed source, and the player's source resolution is a single function — swap it to add a commercial provider (Spotify, Apple, a CDN) without touching the UI.

### Design system
- Self-hosted **Instrument Serif** (display), **Inter** (UI), **JetBrains Mono** (numerals).
- RGB-triplet tokens (`--bg`, `--fg`, `--accent`…) consumed as `rgb(var(--x) / <alpha>)` so alpha variants are free.
- Dark default + full **light theme** (`sonora.theme`), honouring `prefers-color-scheme`.
- Motion-safe animation set, `prefers-reduced-motion` respected, visible focus rings, ARIA labels on every control, semantic landmarks, keyboard-reachable menus and dialogs.

---

## Project structure

```
src/
  app/                 routes (server components: generateStaticParams + metadata)
  components/
    layout/            sidebar, topbar, mobile nav, shell, page header, footer
    player/            seek bar, volume, player bar, panels, full-screen player
    cards/             cover art, media card, track row
    views/             one client view per page type
    ui/                button, primitives, menu, modal
    home/              hero, sections, genre strip
  lib/
    store/             theme, toast, auth, library, player (React context + reducers)
    data/              library-adapter (local ↔ Supabase)
    supabase/          null-safe browser + server clients
    catalog-api.ts     every read the UI needs
    types.ts, utils.ts
  data/catalog.ts      GENERATED — 16 artists · 32 albums · 270 tracks · 22 playlists · 6 podcasts · 12 genres
scripts/
  build-catalog.mjs    regenerates the catalogue
  generate-art.mjs     procedural cover art (8 motifs × 12 palettes, film grain)
supabase/migrations/   schema + RLS
```

`src/data/catalog.ts` is generated. Never hand-edit it — run `npm run catalog`.

---

## Attribution

All demo audio is royalty-free or Creative Commons:

- **SoundHelix** — free demo tracks, soundhelix.com
- **Kevin MacLeod (incompetech.com)** — licensed under Creative Commons: By Attribution 4.0

See `/about/licensing` in the app for the full notice.
