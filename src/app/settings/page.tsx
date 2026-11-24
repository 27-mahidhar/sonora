import type { Metadata } from 'next'
import { SettingsView } from '@/components/views/settings-view'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your SONORA profile, appearance, playback quality and privacy.',
}

export default function SettingsPage() {
  return <SettingsView />
}
