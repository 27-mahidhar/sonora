import type { Metadata } from 'next'
import { AuthShell } from '@/components/layout/auth-shell'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to pick up exactly where you left off — your playlists, likes and listening history are waiting.',
}

export default function SigninPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up exactly where you left off — your playlists, likes and listening history are waiting.">
      <AuthForm mode="signin" />
    </AuthShell>
  )
}
