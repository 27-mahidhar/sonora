'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Database,
  Keyboard,
  Moon,
  Music2,
  Palette,
  ShieldCheck,
  Sun,
  User,
  UserRound,
  Volume2,
} from 'lucide-react'
import { useAuth } from '@/lib/store/auth'
import { useTheme } from '@/lib/store/theme'
import { useLibrary } from '@/lib/store/library'
import { useToast } from '@/lib/store/toast'
import { Kbd, Section } from '@/components/ui/primitives'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['Space'], label: 'Play / pause' },
  { keys: ['→'], label: 'Seek forward 5s' },
  { keys: ['←'], label: 'Seek back 5s' },
  { keys: ['Shift', '→'], label: 'Next track' },
  { keys: ['Shift', '←'], label: 'Previous track' },
  { keys: ['↑', '↓'], label: 'Volume up / down' },
  { keys: ['M'], label: 'Mute' },
  { keys: ['N'], label: 'Next track' },
  { keys: ['P'], label: 'Previous track' },
  { keys: ['S'], label: 'Toggle shuffle' },
  { keys: ['R'], label: 'Cycle repeat' },
  { keys: ['L'], label: 'Like current song' },
  { keys: ['F'], label: 'Full screen player' },
  { keys: ['Q'], label: 'Toggle queue' },
  { keys: ['Y'], label: 'Toggle lyrics' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['Esc'], label: 'Close panel / player' },
]

type Quality = 'auto' | 'high' | 'lossless'

const QUALITIES: { id: Quality; label: string; hint: string }[] = [
  { id: 'auto', label: 'Auto', hint: 'Adapts to your connection' },
  { id: 'high', label: 'High', hint: '320 kbps · 1.4 GB/hour' },
  { id: 'lossless', label: 'Lossless', hint: '24-bit · 7.2 GB/hour' },
]

export function SettingsView() {
  const router = useRouter()
  const { user, signOut, updateProfile, isDemo } = useAuth()
  const { theme, setTheme } = useTheme()
  const { clearHistory } = useLibrary()
  const { toast } = useToast()

  const [name, setName] = useState(user?.displayName ?? '')
  const [quality, setQuality] = useState<Quality>('auto')
  const [autoplay, setAutoplay] = useState(true)
  const [notify, setNotify] = useState(true)

  useEffect(() => {
    setName(user?.displayName ?? '')
  }, [user?.displayName])

  const handleSaveProfile = async () => {
    await updateProfile({ displayName: name })
    toast('Profile updated', 'Your display name has been saved.', 'success')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
          Settings
        </p>
        <h1 className="display text-[clamp(2.2rem,5vw,3.4rem)] text-fg">Your account</h1>
        <p className="mt-2 text-[13px] text-muted">
          Manage how SONORA looks, sounds and remembers what you play.
        </p>
      </header>

      <div className="space-y-10">
        {/* profile */}
        <Section title="Profile">
          <div className="hairline rounded-2xl bg-elevated p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent to-indigo-600 text-2xl font-semibold text-white">
                {user?.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <UserRound className="h-8 w-8 text-white/85" />
                )}
              </div>
              <div className="flex-1 space-y-2.5">
                <div>
                  <label htmlFor="display-name" className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-dim">
                    Display name
                  </label>
                  <input
                    id="display-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-line/25 bg-base-soft px-4 text-[13.5px] text-fg outline-none transition-colors placeholder:text-dim focus:border-accent/50"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[12px] text-dim">
                    Signed in as <span className="text-muted">{user?.email ?? 'guest'}</span>
                  </p>
                  <Button variant="primary" size="sm" onClick={handleSaveProfile}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* appearance */}
        <Section title="Appearance">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'dark' as const, label: 'Dark', icon: Moon },
              { id: 'light' as const, label: 'Light', icon: Sun },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setTheme(o.id)
                  toast('Theme updated', `Switched to ${o.label.toLowerCase()} mode.`, 'success')
                }}
                aria-pressed={theme === o.id}
                className={cn(
                  'hairline flex items-center gap-3 rounded-2xl bg-elevated p-4 text-left transition-all',
                  theme === o.id ? 'shadow-glow-sm' : 'hover:bg-raised'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full',
                    theme === o.id ? 'bg-accent text-white' : 'bg-white/[0.06] text-dim'
                  )}
                >
                  <o.icon className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-medium text-fg">{o.label}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* playback */}
        <Section title="Playback">
          <div className="hairline divide-y divide-line/[0.06] rounded-2xl bg-elevated">
            <div className="p-5">
              <div className="flex items-start gap-3">
                <Palette className="mt-0.5 h-4 w-4 shrink-0 text-dim" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-fg">Audio quality</p>
                  <p className="mt-0.5 text-[11.5px] text-dim">Higher quality uses more data.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUALITIES.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setQuality(q.id)
                          toast('Quality set to ' + q.label, q.hint, 'info')
                        }}
                        aria-pressed={quality === q.id}
                        className={cn(
                          'rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all',
                          quality === q.id
                            ? 'border-accent/60 bg-accent/15 text-accent-soft'
                            : 'border-line/12 text-muted hover:border-line/25 hover:text-fg'
                        )}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <ToggleRow
              icon={<Music2 className="h-4 w-4" />}
              title="Autoplay"
              description="Keep playing similar songs when your queue ends."
              value={autoplay}
              onChange={setAutoplay}
            />
            <ToggleRow
              icon={<Bell className="h-4 w-4" />}
              title="Notifications"
              description="New releases from artists you follow."
              value={notify}
              onChange={setNotify}
            />
          </div>
        </Section>

        {/* shortcuts */}
        <Section title="Keyboard shortcuts">
          <div className="hairline rounded-2xl bg-elevated p-5">
            <div className="mb-4 flex items-center gap-2 text-[12px] text-dim">
              <Keyboard className="h-3.5 w-3.5" />
              Press <Kbd>?</Kbd> anywhere to see these again
            </div>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {SHORTCUTS.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 py-0.5">
                  <span className="text-[12.5px] text-muted">{s.label}</span>
                  <span className="flex shrink-0 gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* data */}
        <Section title="Data & privacy">
          <div className="hairline divide-y divide-line/[0.06] rounded-2xl bg-elevated">
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-dim" />
                <div>
                  <p className="text-[13px] font-medium text-fg">Listening history</p>
                  <p className="mt-0.5 text-[11.5px] text-dim">
                    Clear everything SONORA remembers about what you played.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearHistory()
                  toast('History cleared', 'Your listening history is now empty.', 'info')
                }}
              >
                Clear
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-dim" />
                <div>
                  <p className="text-[13px] font-medium text-fg">Storage</p>
                  <p className="mt-0.5 text-[11.5px] text-dim">
                    {isDemo
                      ? 'Running in demo mode — your library is stored on this device.'
                      : 'Connected to Supabase. Your library syncs across devices.'}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  isDemo ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                )}
              >
                {isDemo ? 'Local' : 'Synced'}
              </span>
            </div>
          </div>
        </Section>

        {/* account actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              signOut()
              router.push('/')
            }}
          >
            Sign out
          </Button>
          <Button variant="ghost" onClick={() => router.push('/about/licensing')}>
            Licensing
          </Button>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-dim">{icon}</span>
        <div>
          <p className="text-[13px] font-medium text-fg">{title}</p>
          <p className="mt-0.5 text-[11.5px] text-dim">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={title}
        onClick={() => onChange(!value)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          value ? 'bg-accent' : 'bg-white/[0.14]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            value ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}
