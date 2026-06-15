export type DetectedProject = {
  path: string
  name: string
  manifests: string[]
  language: string | null
  lastModifiedMs: number
}

export type ProjectDetails = {
  path: string
  manifests: string[]
  readmeMarkdown: string | null
  lastModifiedMs: number
}

export type Project = {
  id: string
  path: string
  name: string
  source: 'scanned' | 'manual'
  scanRootId: string | null
  language: string | null
  manifests: string[]
  lastModifiedMs: number
}

export type GitStatus = {
  isRepo: boolean
  branch: string | null
  isDirty: boolean
  detached: boolean
}

export type ScanRoot = { id: string; path: string; label?: string }

export type Launcher = {
  id: string
  name: string
  icon: string // lucide icon name
  commandTemplate: string // contains "{path}"
}
