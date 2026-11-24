'use client'

import type { ReactNode } from 'react'
import { ThemeProvider } from '@/lib/store/theme'
import { ToastProvider } from '@/lib/store/toast'
import { AuthProvider } from '@/lib/store/auth'
import { LibraryProvider } from '@/lib/store/library'
import { PlayerProvider } from '@/lib/store/player'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LibraryProvider>
            <PlayerProvider>{children}</PlayerProvider>
          </LibraryProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
