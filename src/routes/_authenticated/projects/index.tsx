import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Projects } from '@/features/projects'

const projectsSearchSchema = z.object({
  view: z.enum(['table', 'grid']).optional().catch(undefined),
  page: z.number().optional().catch(undefined),
  pageSize: z.number().optional().catch(undefined),
  filter: z.string().optional().catch(undefined),
  language: z.array(z.string()).optional().catch(undefined),
  source: z.array(z.string()).optional().catch(undefined),
  scanRootId: z.array(z.string()).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/projects/')({
  validateSearch: projectsSearchSchema,
  component: Projects,
})
