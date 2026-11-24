'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSupabaseBrowser, supabaseConfigured } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types'
import { sleep, uid } from '@/lib/utils'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  isDemo: boolean
  supabaseReady: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  continueAsGuest: () => Promise<void>
  updateProfile: (patch: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const SESSION_KEY = 'sonora.session.v1'
const USERS_KEY = 'sonora.users.v1'

/* ------------------------------------------------------------------ */
/* Local demo auth helpers                                             */
/* ------------------------------------------------------------------ */
async function digest(input: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return input
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function readLocalUsers(): Record<string, { hash: string; profile: UserProfile }> {
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeLocalUsers(users: Record<string, { hash: string; profile: UserProfile }>) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* ignore */
  }
}

const DEMO_PROFILE: UserProfile = {
  id: 'demo-user',
  email: 'demo@sonora.app',
  displayName: 'Akhil Varma',
  avatarUrl: '/art/artist-aarav-rao.jpg',
  createdAt: new Date('2024-02-11T00:00:00Z').toISOString(),
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  /* ------------------------- restore session ------------------------ */
  useEffect(() => {
    let active = true

    async function restore() {
      if (supabaseConfigured) {
        const supabase = getSupabaseBrowser()
        if (!supabase) {
          setLoading(false)
          return
        }
        const { data } = await supabase.auth.getSession()
        if (!active) return
        const sessionUser = data.session?.user
        if (sessionUser) {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email ?? '',
            displayName:
              (sessionUser.user_metadata?.displayName as string) ||
              sessionUser.email?.split('@')[0] ||
              'Listener',
            avatarUrl: (sessionUser.user_metadata?.avatarUrl as string) || undefined,
            createdAt: sessionUser.created_at ?? new Date().toISOString(),
          })
        }
        setLoading(false)

        const { data: sub } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: any } | null) => {
          const u = session?.user
          setUser(
            u
              ? {
                  id: u.id,
                  email: u.email ?? '',
                  displayName:
                    (u.user_metadata?.displayName as string) || u.email?.split('@')[0] || 'Listener',
                  avatarUrl: (u.user_metadata?.avatarUrl as string) || undefined,
                  createdAt: u.created_at ?? new Date().toISOString(),
                }
              : null
          )
        })
        return () => {
          sub.subscription.unsubscribe()
        }
      }

      // Local demo mode
      try {
        const raw = window.localStorage.getItem(SESSION_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { profile: UserProfile }
          if (active) setUser(parsed.profile)
        }
      } catch {
        /* ignore */
      }
      if (active) setLoading(false)
    }

    restore()
    return () => {
      active = false
    }
  }, [])

  /* ------------------------------ sign in --------------------------- */
  const signIn = useCallback(async (email: string, password: string) => {
    if (supabaseConfigured) {
      const supabase = getSupabaseBrowser()
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error ? { error: error.message } : {}
    }

    await sleep(650)
    const key = email.trim().toLowerCase()
    if (key === 'demo@sonora.app' && password === 'sonora123') {
      setUser(DEMO_PROFILE)
      try {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify({ profile: DEMO_PROFILE }))
      } catch {
        /* ignore */
      }
      return {}
    }
    const users = readLocalUsers()
    const record = users[key]
    if (!record) return { error: 'No account found with that email.' }
    const hashed = await digest(password)
    if (hashed !== record.hash) return { error: 'Incorrect password. Please try again.' }
    setUser(record.profile)
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ profile: record.profile }))
    } catch {
      /* ignore */
    }
    return {}
  }, [])

  /* ------------------------------ sign up --------------------------- */
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (supabaseConfigured) {
      const supabase = getSupabaseBrowser()
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { displayName } },
      })
      return error ? { error: error.message } : {}
    }

    await sleep(750)
    const key = email.trim().toLowerCase()
    const users = readLocalUsers()
    if (users[key]) return { error: 'An account with that email already exists.' }
    const profile: UserProfile = {
      id: uid('user'),
      email: key,
      displayName: displayName.trim() || key.split('@')[0],
      createdAt: new Date().toISOString(),
    }
    users[key] = { hash: await digest(password), profile }
    writeLocalUsers(users)
    setUser(profile)
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ profile }))
    } catch {
      /* ignore */
    }
    return {}
  }, [])

  /* ------------------------------ sign out -------------------------- */
  const signOut = useCallback(async () => {
    if (supabaseConfigured) {
      const supabase = getSupabaseBrowser()
      await supabase?.auth.signOut()
    }
    try {
      window.localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setUser(null)
  }, [])

  /* ------------------------------ guest ----------------------------- */
  const continueAsGuest = useCallback(async () => {
    await sleep(420)
    const guest: UserProfile = {
      ...DEMO_PROFILE,
      id: 'guest-user',
      email: 'guest@sonora.app',
      displayName: 'Guest Listener',
      avatarUrl: undefined,
    }
    setUser(guest)
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ profile: guest }))
    } catch {
      /* ignore */
    }
  }, [])

  /* ------------------------------ profile --------------------------- */
  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>) => {
      if (supabaseConfigured) {
        const supabase = getSupabaseBrowser()
        await supabase?.auth.updateUser({ data: patch })
      }
      setUser((prev) => {
        if (!prev) return prev
        const next = { ...prev, ...patch }
        try {
          window.localStorage.setItem(SESSION_KEY, JSON.stringify({ profile: next }))
        } catch {
          /* ignore */
        }
        return next
      })
    },
    []
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemo: !supabaseConfigured,
      supabaseReady: supabaseConfigured,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      updateProfile,
    }),
    [user, loading, signIn, signUp, signOut, continueAsGuest, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
