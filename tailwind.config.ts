import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1440px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        base: 'rgb(var(--bg) / <alpha-value>)',
        'base-soft': 'rgb(var(--bg-soft) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        overlay: 'rgb(var(--overlay) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        dim: 'rgb(var(--dim) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
      },
      spacing: {
        player: 'var(--player-h)',
        sidebar: 'var(--sidebar-w)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up': 'fadeUp 620ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-up-sm': 'fadeUpSm 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 460ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slideInRight 380ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 360ms cubic-bezier(0.16, 1, 0.3, 1) both',
        marquee: 'marquee 45s linear infinite',
        'spin-slow': 'spin 16s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-soft': 'pulseSoft 3.4s ease-in-out infinite',
        'drift': 'drift 24s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUpSm: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
        drift: {
          '0%': { transform: 'translate3d(-4%, -2%, 0) scale(1)' },
          '100%': { transform: 'translate3d(4%, 3%, 0) scale(1.12)' },
        },
      },
      transitionTimingFunction: {
        snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(139 92 246 / 0.3), 0 10px 44px -10px rgb(139 92 246 / 0.5)',
        'glow-sm': '0 0 0 1px rgb(139 92 246 / 0.25), 0 6px 24px -8px rgb(139 92 246 / 0.45)',
        float: '0 24px 70px -24px rgb(0 0 0 / 0.85)',
      },
    },
  },
  plugins: [],
}

export default config
