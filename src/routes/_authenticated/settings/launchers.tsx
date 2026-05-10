import { createFileRoute } from '@tanstack/react-router'

import { SettingsLaunchers } from '@/features/settings/launchers'

export const Route = createFileRoute('/_authenticated/settings/launchers')({
  component: SettingsLaunchers,
})
