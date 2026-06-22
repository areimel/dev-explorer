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

export type ProjectCardMeta = {
  path: string
  // `.git/description` (when not git's default placeholder), else a README excerpt
  description: string | null
  // "data:image/...;base64,..." for an auto-detected repo image, else null
  thumbnailDataUri: string | null
}

export type ScanRoot = { id: string; path: string; label?: string }

export type Launcher = {
  id: string
  name: string
  icon: string // lucide icon name
  commandTemplate: string // contains "{path}"
}

// --- Schema introspection types (used by the DB schema viewer page) ---

export type SchemaColumn = {
  name: string
  type: string
  notNull: boolean
  primaryKey: boolean
  defaultValue: string | null
}

export type SchemaForeignKey = {
  column: string
  refTable: string
  refColumn: string
  onDelete: string
}

export type SchemaIndex = {
  name: string
  unique: boolean
  columns: string[]
}

export type TableSchema = {
  name: string
  columns: SchemaColumn[]
  foreignKeys: SchemaForeignKey[]
  indexes: SchemaIndex[]
}

export type Template = {
  id: string
  name: string
  description: string
  repoUrl: string
  language: string | null
  tags: string[]
}

export type GitHubProfile = {
  login: string
  name: string | null
  avatarUrl: string
  bio: string | null
  publicRepos: number
  followers: number
  following: number
  htmlUrl: string
  location: string | null
  company: string | null
}

export type ContributionDay = { date: string; count: number; level: number }
export type ContributionWeek = { days: ContributionDay[] }
export type ContributionCalendar = {
  totalContributions: number
  weeks: ContributionWeek[]
}
