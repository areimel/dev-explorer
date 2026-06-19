import { createFileRoute } from '@tanstack/react-router'

import { SettingsSchema } from '@/features/settings/schema'

export const Route = createFileRoute('/_authenticated/settings/schema')({
  component: SettingsSchema,
})
