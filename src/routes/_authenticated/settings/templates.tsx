import { createFileRoute } from '@tanstack/react-router'

import { SettingsTemplates } from '@/features/settings/templates'

export const Route = createFileRoute('/_authenticated/settings/templates')({
  component: SettingsTemplates,
})
