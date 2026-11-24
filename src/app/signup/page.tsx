import type { Metadata } from 'next'
import { AuthShell } from '@/components/layout/auth-shell'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a free account to save songs, follow artists and build playlists that follow you everywhere.',
}

export default function SignupPage() {
  return (
    <AuthShell title="Start listening" subtitle="Create a free account to save songs, follow artists and build playlists that follow you everywhere.">
      <AuthForm mode="signup" />
    </AuthShell>
  )
}
