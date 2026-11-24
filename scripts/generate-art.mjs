/**
 * SONORA — generative artwork engine
 * Produces deterministic, high-quality SVG album artwork from a seed string.
 * The visual language is deliberately graphic: a saturated colour field, one
 * bold focal shape, film grain. Every cover is unique but the system reads as
 * one label's identity.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'public', 'art', 'gen')

/* ------------------------------------------------------------------ */
/* Palettes — rich, saturated, and legible against a near-black UI     */
/* ------------------------------------------------------------------ */
const PALETTES = [
  { base: '#2b1a63', deep: '#0a0518', accent: '#c4a7ff', hot: '#f3edff' },
  { base: '#0f3242', deep: '#03121a', accent: '#7fd9ee', hot: '#eafaff' },
  { base: '#4a1226', deep: '#140308', accent: '#ff9fb4', hot: '#fff0f3' },
  { base: '#123a22', deep: '#03120a', accent: '#8fe3a0', hot: '#eefbec' },
  { base: '#4a3310', deep: '#160f04', accent: '#f5cd7d', hot: '#fff6e4' },
  { base: '#26262e', deep: '#08080a', accent: '#e9e9ee', hot: '#ffffff' },
  { base: '#3d1050', deep: '#120418', accent: '#e3a6ff', hot: '#fbf0ff' },
  { base: '#0a2f38', deep: '#03151a', accent: '#93ebd8', hot: '#eafcf8' },
  { base: '#4a1a0e', deep: '#170804', accent: '#ffb894', hot: '#fff2e9' },
  { base: '#12245c', deep: '#04081a', accent: '#a8c0ff', hot: '#eef3ff' },
  { base: '#4a0f45', deep: '#150414', accent: '#ff9fe4', hot: '#fff0fa' },
  { base: '#0d3a36', deep: '#031514', accent: '#8fe8e0', hot: '#eafffd' },
]

const MOTIFS = [
  'eclipse',
  'bars',
  'sweep',
  'rings',
  'diagonal',
  'weave',
  'dune',
  'halftone',
]

function hash(str) {
  return createHash('md5').update(str).digest()
}

function rng(seed) {
  const b = hash(seed)
  let a = b.readUInt32LE(0)
  let c = b.readUInt32LE(4)
  return () => {
    a >>>= 0
    c >>>= 0
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(c ^ (c >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* Motifs                                                              */
/* ------------------------------------------------------------------ */
function motif(kind, p, r) {
  const C = 1000
  switch (kind) {
    case 'eclipse': {
      const cx = 320 + r() * 360
      const cy = 300 + r() * 400
      const rad = 210 + r() * 130
      const off = 70 + r() * 110
      const ang = r() * Math.PI * 2
      return `
        <circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="${p.hot}" fill-opacity="0.92"/>
        <circle cx="${(cx + Math.cos(ang) * off).toFixed(0)}" cy="${(cy + Math.sin(ang) * off).toFixed(0)}" r="${(rad * 0.94).toFixed(0)}" fill="${p.deep}" fill-opacity="0.97"/>
        <circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="none" stroke="${p.accent}" stroke-opacity="0.75" stroke-width="3"/>`
    }

    case 'bars': {
      const n = 4 + Math.floor(r() * 4)
      const gap = 26
      const w = (C - gap * (n + 1)) / n
      let s = ''
      for (let i = 0; i < n; i++) {
        const h = 220 + r() * 560
        const x = gap + i * (w + gap)
        const y = C - h - 60 - r() * 120
        s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(w / 2).toFixed(1)}" fill="${i === Math.floor(n / 2) ? p.hot : p.accent}" fill-opacity="${i === Math.floor(n / 2) ? 0.97 : 0.68 + r() * 0.3}"/>`
      }
      return s
    }

    case 'sweep': {
      const cx = 200 + r() * 600
      const cy = 200 + r() * 600
      const rad = 320 + r() * 220
      const a0 = r() * Math.PI * 2
      const a1 = a0 + Math.PI * (0.55 + r() * 0.5)
      const x0 = cx + rad * Math.cos(a0)
      const y0 = cy + rad * Math.sin(a0)
      const x1 = cx + rad * Math.cos(a1)
      const y1 = cy + rad * Math.sin(a1)
      const sw = 26 + r() * 60
      return `
        <circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(0)}" fill="none" stroke="${p.accent}" stroke-opacity="0.26" stroke-width="${(sw * 0.35).toFixed(1)}"/>
        <path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${rad.toFixed(0)} ${rad.toFixed(0)} 0 1 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${p.hot}" stroke-opacity="0.9" stroke-width="${sw.toFixed(1)}" stroke-linecap="round"/>`
    }

    case 'rings': {
      const cx = 400 + r() * 200
      const cy = 380 + r() * 240
      const n = 6 + Math.floor(r() * 5)
      const thick = 2 + Math.floor(r() * n)
      let s = ''
      for (let i = n; i > 0; i--) {
        const rad = 70 + i * (44 + r() * 12)
        const isThick = i === thick
        s += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rad.toFixed(1)}" fill="none" stroke="${isThick ? p.hot : p.accent}" stroke-opacity="${isThick ? 0.9 : 0.22 + (n - i) * 0.05}" stroke-width="${isThick ? (10 + r() * 16).toFixed(1) : (1 + r() * 2).toFixed(1)}"/>`
      }
      return s
    }

    case 'diagonal': {
      const ang = -30 + r() * 60
      const y = 300 + r() * 400
      const w = 90 + r() * 150
      return `
        <g transform="rotate(${ang.toFixed(1)} 500 500)">
          <rect x="-300" y="${(y - w / 2).toFixed(0)}" width="1600" height="${w.toFixed(0)}" fill="${p.accent}" fill-opacity="0.96"/>
          <rect x="-300" y="${(y - w / 2 - 24).toFixed(0)}" width="1600" height="10" fill="${p.hot}" fill-opacity="0.85"/>
          <rect x="-300" y="${(y + w / 2 + 14).toFixed(0)}" width="1600" height="10" fill="${p.hot}" fill-opacity="0.85"/>
        </g>`
    }

    case 'weave': {
      const n = 7 + Math.floor(r() * 5)
      let s = ''
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1)
        const y = 120 + t * 760
        const amp = 40 + r() * 90
        const ph = r() * Math.PI * 2
        s += `<path d="M -100 ${y.toFixed(0)} C 200 ${(y - amp * Math.sin(ph)).toFixed(0)}, 420 ${(y + amp * Math.cos(ph)).toFixed(0)}, 620 ${(y - amp * 0.6).toFixed(0)} S 980 ${(y + amp).toFixed(0)}, 1100 ${y.toFixed(0)}" fill="none" stroke="${i === Math.floor(n / 2) ? p.hot : p.accent}" stroke-opacity="${i === Math.floor(n / 2) ? 0.95 : 0.42 + r() * 0.4}" stroke-width="${(i === Math.floor(n / 2) ? 12 : 2 + r() * 4).toFixed(1)}"/>`
      }
      return s
    }

    case 'dune': {
      let s = ''
      const n = 4 + Math.floor(r() * 3)
      for (let i = 0; i < n; i++) {
        const y = 520 + i * (90 + r() * 40)
        const amp = 80 + r() * 120
        const o = 0.2 + i * 0.15
        s += `<path d="M -100 ${y.toFixed(0)} C 240 ${(y - amp).toFixed(0)}, 500 ${(y + amp * 0.7).toFixed(0)}, 760 ${(y - amp * 0.4).toFixed(0)} S 1080 ${(y + amp * 0.5).toFixed(0)}, 1150 ${y.toFixed(0)} L 1150 1100 L -100 1100 Z" fill="${i === n - 1 ? p.hot : p.accent}" fill-opacity="${i === n - 1 ? 0.85 : o.toFixed(2)}"/>`
      }
      return s
    }

    case 'halftone': {
      const step = 42
      const cx = 380 + r() * 240
      const cy = 340 + r() * 320
      let s = ''
      for (let y = 0; y < 25; y++) {
        for (let x = 0; x < 25; x++) {
          const d = Math.hypot(x * step - cx, y * step - cy) / 620
          const rad = Math.max(0.6, (1 - Math.min(1, d)) * 15)
          s += `<circle cx="${x * step + 10}" cy="${y * step + 10}" r="${rad.toFixed(2)}" fill="${p.hot}" fill-opacity="${(0.1 + (1 - Math.min(1, d)) * 0.72).toFixed(3)}"/>`
        }
      }
      return s
    }

    default:
      return ''
  }
}

/* ------------------------------------------------------------------ */
/* Cover                                                               */
/* ------------------------------------------------------------------ */
export function coverSvg(seed, { motif: forced } = {}) {
  const r = rng(seed)
  const p = PALETTES[Math.floor(r() * PALETTES.length)]
  const kind = forced || MOTIFS[Math.floor(r() * MOTIFS.length)]
  const gx = 30 + r() * 40
  const gy = 20 + r() * 40

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${p.base}"/>
    <stop offset="70%" stop-color="${p.deep}"/>
    <stop offset="100%" stop-color="${p.deep}"/>
  </linearGradient>
  <radialGradient id="glow" cx="${gx.toFixed(0)}%" cy="${gy.toFixed(0)}%" r="72%">
    <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.78"/>
    <stop offset="55%" stop-color="${p.accent}" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
    <stop offset="45%" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="vig" cx="50%" cy="48%" r="76%">
    <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
  </radialGradient>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="4" stitchTiles="stitch" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0"/>
  </filter>
</defs>
<rect width="1000" height="1000" fill="url(#bg)"/>
<rect width="1000" height="1000" fill="url(#glow)"/>
${motif(kind, p, r)}
<rect width="1000" height="1000" fill="url(#sheen)"/>
<rect width="1000" height="1000" fill="url(#vig)"/>
<rect width="1000" height="1000" filter="url(#grain)" opacity="0.16" style="mix-blend-mode:overlay"/>
</svg>`
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */
export function avatarSvg(seed, name) {
  const r = rng(seed + ':avatar')
  const p = PALETTES[Math.floor(r() * PALETTES.length)]
  const initial = (name || 'S').trim().charAt(0).toUpperCase()
  const x = 260 + r() * 160
  const y = 220 + r() * 180
  const rad = 260 + r() * 140
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000" role="img">
<defs>
  <linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${p.base}"/>
    <stop offset="100%" stop-color="${p.deep}"/>
  </linearGradient>
  <radialGradient id="o" cx="35%" cy="30%" r="70%">
    <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.8"/>
    <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="1000" height="1000" fill="url(#b)"/>
<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(0)}" fill="url(#o)"/>
<g fill="none" stroke="${p.hot}" stroke-opacity="0.13">
  <circle cx="500" cy="500" r="430" stroke-width="2"/>
  <circle cx="500" cy="500" r="352" stroke-width="1.5" stroke-dasharray="3 14"/>
  <circle cx="500" cy="500" r="470" stroke-width="1"/>
</g>
<path d="M 120 500 A 380 380 0 0 1 500 120" fill="none" stroke="${p.hot}" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round"/>
<text x="500" y="512" text-anchor="middle" dominant-baseline="central" font-family="Georgia, 'Times New Roman', serif" font-size="470" fill="${p.hot}" fill-opacity="0.95">${initial}</text>
<rect width="1000" height="1000" filter="url(#g)" opacity="0.14" style="mix-blend-mode:overlay"/>
<radialGradient id="v" cx="50%" cy="45%" r="75%">
  <stop offset="55%" stop-color="#000" stop-opacity="0"/>
  <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
</radialGradient>
<rect width="1000" height="1000" fill="url(#v)"/>
</svg>`
}

export function writeArtwork(slug, seed, kind = 'album', name = '') {
  mkdirSync(OUT, { recursive: true })
  const svg = kind === 'avatar' ? avatarSvg(seed, name) : coverSvg(seed)
  writeFileSync(join(OUT, `${slug}.svg`), svg)
  return `/art/gen/${slug}.svg`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2] || 'sample'
  const seed = process.argv[3] || slug
  console.log(writeArtwork(slug, seed))
}
