'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '@/lib/store/auth'
import { useToast } from '@/lib/store/toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const { signIn, signUp, continueAsGuest, isDemo } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState(isDemo && mode === 'signin' ? 'demo@sonora.app' : '')
  const [password, setPassword] = useState(isDemo && mode === 'signin' ? 'sonora123' : '')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result =
        mode === 'signin'
          ? await signIn(email, password)
          : await signUp(email, password, displayName)
      if (result.error) {
        setError(result.error)
        return
      }
      toast(mode === 'signin' ? 'Welcome back' : 'Account created', 'Signed in to SONORA.', 'success')
      router.push('/')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === 'signup' ? (
        <Field
          label="Display name"
          icon={<User className="h-4 w-4" />}
          id="name"
        >
          <input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should we call you?"
            autoComplete="name"
            required
            className="h-11 w-full bg-transparent pr-4 text-[14px] text-fg outline-none placeholder:text-dim"
          />
        </Field>
      ) : null}

      <Field label="Email" icon={<Mail className="h-4 w-4" />} id="email">
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="h-11 w-full bg-transparent pr-4 text-[14px] text-fg outline-none placeholder:text-dim"
        />
      </Field>

      <Field label="Password" icon={<Lock className="h-4 w-4" />} id="password">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          required
          minLength={mode === 'signup' ? 8 : undefined}
          className="h-11 w-full bg-transparent pr-4 text-[14px] text-fg outline-none placeholder:text-dim"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="rounded-full p-2 text-dim transition-colors hover:text-fg"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </Field>

      {error ? (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-[12.5px] text-rose-300">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="w-full rounded-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <div className="relative py-1">
        <div className="h-px bg-line/[0.08]" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-base px-3 text-[10.5px] uppercase tracking-[0.14em] text-dim">
          or
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full rounded-full"
        onClick={async () => {
          await continueAsGuest()
          toast('Welcome to SONORA', 'Browsing as a guest.', 'success')
          router.push('/')
        }}
      >
        Continue as guest
      </Button>

      {isDemo ? (
        <div className="rounded-xl border border-accent/20 bg-accent/[0.07] px-3.5 py-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent-soft">
            Demo account
          </p>
          <p className="mt-1 font-mono text-[11.5px] text-muted">
            demo@sonora.app · sonora123
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-dim">
            Credentials are pre-filled. No Supabase project is configured, so this runs locally.
          </p>
        </div>
      ) : null}

      <p className="pt-2 text-center text-[12.5px] text-dim">
        {mode === 'signin' ? (
          <>
            New to SONORA?{' '}
            <Link href="/signup" className="font-medium text-accent-soft hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/signin" className="font-medium text-accent-soft hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  )
}

function Field({
  label,
  icon,
  id,
  children,
}: {
  label: string
  icon: React.ReactNode
  id: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-dim">
        {label}
      </label>
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-line/10 bg-elevated pl-3.5 transition-colors focus-within:border-accent/50">
        <span className="shrink-0 text-dim">{icon}</span>
        {children}
      </div>
    </div>
  )
}
