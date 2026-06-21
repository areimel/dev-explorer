import Database from '@tauri-apps/plugin-sql'

import type {
  Launcher,
  Project,
  ScanRoot,
  SchemaColumn,
  SchemaForeignKey,
  SchemaIndex,
  TableSchema,
} from './types'

// ---------------------------------------------------------------------------
// Lazy singleton — importing this module never touches Tauri until getDb()
// is actually called (safe for browser/test environments).
// ---------------------------------------------------------------------------

let dbPromise: Promise<Database> | null = null

async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await Database.load('sqlite:devexplorer.db')
      // FK enforcement is per-connection in SQLite — REQUIRED for cascades/set-null
      await db.execute('PRAGMA foreign_keys = ON')
      return db
    })()
  }
  return dbPromise
}

// ---------------------------------------------------------------------------
// Raw DB row shapes (snake_case)
// ---------------------------------------------------------------------------

type ProjectRow = {
  id: string
  path: string
  name: string
  source: 'scanned' | 'manual'
  scan_root_id: string | null
  language: string | null
  manifests: string
  last_modified_ms: number
  created_at: number
  updated_at: number
}

type ScanRootRow = {
  id: string
  path: string
  label: string | null
  created_at: number
  updated_at: number
}

type LauncherRow = {
  id: string
  name: string
  icon: string
  command_template: string
  sort_order: number
  created_at: number
  updated_at: number
}

type AppMetaRow = {
  key: string
  value: string
  updated_at: number
}

type PragmaTableInfoRow = {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: string | null
  pk: number
}

type PragmaForeignKeyRow = {
  id: number
  seq: number
  table: string
  from: string
  to: string
  on_update: string
  on_delete: string
  match: string
}

type PragmaIndexListRow = {
  seq: number
  name: string
  unique: number
  origin: string
  partial: number
}

type PragmaIndexInfoRow = {
  seqno: number
  cid: number
  name: string
}

// ---------------------------------------------------------------------------
// Row mappers: DB (snake_case) <-> TS (camelCase)
// ---------------------------------------------------------------------------

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    source: row.source,
    scanRootId: row.scan_root_id,
    language: row.language,
    manifests: (() => {
      try {
        const parsed = JSON.parse(row.manifests)
        return Array.isArray(parsed) ? (parsed as string[]) : []
      } catch {
        return []
      }
    })(),
    lastModifiedMs: row.last_modified_ms,
  }
}

function rowToScanRoot(row: ScanRootRow): ScanRoot {
  return {
    id: row.id,
    path: row.path,
    label: row.label ?? undefined,
  }
}

function rowToLauncher(row: LauncherRow): Launcher {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    commandTemplate: row.command_template,
  }
}

// ---------------------------------------------------------------------------
// Table list (hardcoded — must match the v1 migration)
// ---------------------------------------------------------------------------

const DB_TABLES = [
  'scan_roots',
  'projects',
  'launchers',
  'project_overrides',
  'app_meta',
] as const

// ---------------------------------------------------------------------------
// dbRepo — the public repository interface
// ---------------------------------------------------------------------------

export const dbRepo = {
  // -------------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------------

  async listProjects(): Promise<Project[]> {
    const db = await getDb()
    const rows = await db.select<ProjectRow[]>('SELECT * FROM projects')
    return rows.map(rowToProject)
  },

  async upsertProject(p: Project): Promise<void> {
    const db = await getDb()
    const now = Date.now()
    await db.execute(
      `INSERT INTO projects
         (id, path, name, source, scan_root_id, language, manifests, last_modified_ms, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT(id) DO UPDATE SET
         path             = excluded.path,
         name             = excluded.name,
         source           = excluded.source,
         scan_root_id     = excluded.scan_root_id,
         language         = excluded.language,
         manifests        = excluded.manifests,
         last_modified_ms = excluded.last_modified_ms,
         created_at       = projects.created_at,
         updated_at       = $10`,
      [
        p.id,
        p.path,
        p.name,
        p.source,
        p.scanRootId,
        p.language,
        JSON.stringify(p.manifests),
        p.lastModifiedMs,
        now,
        now,
      ]
    )
  },

  async upsertProjects(ps: Project[]): Promise<void> {
    if (ps.length === 0) return
    const db = await getDb()
    const now = Date.now()
    await db.execute('BEGIN')
    try {
      for (const p of ps) {
        await db.execute(
          `INSERT INTO projects
             (id, path, name, source, scan_root_id, language, manifests, last_modified_ms, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT(id) DO UPDATE SET
             path             = excluded.path,
             name             = excluded.name,
             source           = excluded.source,
             scan_root_id     = excluded.scan_root_id,
             language         = excluded.language,
             manifests        = excluded.manifests,
             last_modified_ms = excluded.last_modified_ms,
             created_at       = projects.created_at,
             updated_at       = $10`,
          [
            p.id,
            p.path,
            p.name,
            p.source,
            p.scanRootId,
            p.language,
            JSON.stringify(p.manifests),
            p.lastModifiedMs,
            now,
            now,
          ]
        )
      }
      await db.execute('COMMIT')
    } catch (err) {
      await db.execute('ROLLBACK')
      throw err
    }
  },

  async deleteProject(id: string): Promise<void> {
    const db = await getDb()
    await db.execute('DELETE FROM projects WHERE id = $1', [id])
  },

  /**
   * Delete scanned projects belonging to `rootId` whose path is NOT in
   * `keepPaths`. Used after a rescan to prune projects that have disappeared.
   */
  async deleteScannedProjectsForRoot(
    rootId: string,
    keepPaths: string[]
  ): Promise<void> {
    const db = await getDb()
    if (keepPaths.length === 0) {
      // Delete all scanned projects for this root
      await db.execute(
        `DELETE FROM projects WHERE source = 'scanned' AND scan_root_id = $1`,
        [rootId]
      )
      return
    }
    // SQLite doesn't support table-valued parameters, so build a placeholder list
    const placeholders = keepPaths.map((_, i) => `$${i + 2}`).join(', ')
    await db.execute(
      `DELETE FROM projects
       WHERE source = 'scanned'
         AND scan_root_id = $1
         AND path NOT IN (${placeholders})`,
      [rootId, ...keepPaths]
    )
  },

  // -------------------------------------------------------------------------
  // Scan roots
  // -------------------------------------------------------------------------

  async listScanRoots(): Promise<ScanRoot[]> {
    const db = await getDb()
    const rows = await db.select<ScanRootRow[]>(
      'SELECT * FROM scan_roots ORDER BY created_at'
    )
    return rows.map(rowToScanRoot)
  },

  async upsertScanRoot(r: ScanRoot): Promise<void> {
    const db = await getDb()
    const now = Date.now()
    await db.execute(
      `INSERT INTO scan_roots (id, path, label, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT(id) DO UPDATE SET
         path       = excluded.path,
         label      = excluded.label,
         created_at = scan_roots.created_at,
         updated_at = $5`,
      [r.id, r.path, r.label ?? null, now, now]
    )
  },

  async deleteScanRoot(id: string): Promise<void> {
    const db = await getDb()
    // FK ON DELETE SET NULL propagates to projects.scan_root_id automatically
    await db.execute('DELETE FROM scan_roots WHERE id = $1', [id])
  },

  // -------------------------------------------------------------------------
  // Launchers
  // sort_order is internal to db.ts — the public Launcher type does not carry
  // it. listLaunchers() returns rows ordered by sort_order so callers get a
  // correctly-ordered array identical to the previous tauriStore behaviour.
  // setLauncherOrder() translates array-index back to sort_order column values.
  // -------------------------------------------------------------------------

  async listLaunchers(): Promise<Launcher[]> {
    const db = await getDb()
    const rows = await db.select<LauncherRow[]>(
      'SELECT * FROM launchers ORDER BY sort_order'
    )
    return rows.map(rowToLauncher)
  },

  async upsertLauncher(l: Launcher, sortOrder?: number): Promise<void> {
    const db = await getDb()
    const now = Date.now()
    // When sortOrder is not supplied, use a large sentinel so new launchers
    // naturally append. On conflict, preserve existing sort_order unless an
    // explicit value is passed.
    const order = sortOrder ?? Number.MAX_SAFE_INTEGER
    await db.execute(
      `INSERT INTO launchers (id, name, icon, command_template, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(id) DO UPDATE SET
         name             = excluded.name,
         icon             = excluded.icon,
         command_template = excluded.command_template,
         sort_order       = CASE WHEN $5 = ${Number.MAX_SAFE_INTEGER} THEN launchers.sort_order ELSE excluded.sort_order END,
         created_at       = launchers.created_at,
         updated_at       = $7`,
      [l.id, l.name, l.icon, l.commandTemplate, order, now, now]
    )
  },

  async deleteLauncher(id: string): Promise<void> {
    const db = await getDb()
    await db.execute('DELETE FROM launchers WHERE id = $1', [id])
  },

  /** Update sort_order for each launcher in the given ordered array of ids. */
  async setLauncherOrder(orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return
    const db = await getDb()
    const now = Date.now()
    await db.execute('BEGIN')
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.execute(
          'UPDATE launchers SET sort_order = $1, updated_at = $2 WHERE id = $3',
          [i, now, orderedIds[i]]
        )
      }
      await db.execute('COMMIT')
    } catch (err) {
      await db.execute('ROLLBACK')
      throw err
    }
  },

  // -------------------------------------------------------------------------
  // App meta (key/value pairs)
  // -------------------------------------------------------------------------

  async getMeta(key: string): Promise<string | null> {
    const db = await getDb()
    const rows = await db.select<AppMetaRow[]>(
      'SELECT value FROM app_meta WHERE key = $1',
      [key]
    )
    return rows[0]?.value ?? null
  },

  async setMeta(key: string, value: string): Promise<void> {
    const db = await getDb()
    const now = Date.now()
    await db.execute(
      `INSERT INTO app_meta (key, value, updated_at) VALUES ($1, $2, $3)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = $3`,
      [key, value, now]
    )
  },

  // -------------------------------------------------------------------------
  // Schema introspection
  // -------------------------------------------------------------------------

  async getSchema(): Promise<TableSchema[]> {
    const db = await getDb()
    const result: TableSchema[] = []

    for (const tableName of DB_TABLES) {
      // Columns
      const colRows = await db.select<PragmaTableInfoRow[]>(
        `PRAGMA table_info(${tableName})`
      )
      const columns: SchemaColumn[] = colRows.map((r) => ({
        name: r.name,
        type: r.type,
        notNull: r.notnull === 1,
        primaryKey: r.pk > 0,
        defaultValue: r.dflt_value,
      }))

      // Foreign keys
      const fkRows = await db.select<PragmaForeignKeyRow[]>(
        `PRAGMA foreign_key_list(${tableName})`
      )
      const foreignKeys: SchemaForeignKey[] = fkRows.map((r) => ({
        column: r.from,
        refTable: r.table,
        refColumn: r.to,
        onDelete: r.on_delete,
      }))

      // Indexes (skip auto-generated sqlite_ internal indexes)
      const idxListRows = await db.select<PragmaIndexListRow[]>(
        `PRAGMA index_list(${tableName})`
      )
      const indexes: SchemaIndex[] = []
      for (const idxRow of idxListRows) {
        if (idxRow.name.startsWith('sqlite_')) continue
        const idxInfoRows = await db.select<PragmaIndexInfoRow[]>(
          `PRAGMA index_info(${idxRow.name})`
        )
        indexes.push({
          name: idxRow.name,
          unique: idxRow.unique === 1,
          columns: idxInfoRows.map((r) => r.name),
        })
      }

      result.push({ name: tableName, columns, foreignKeys, indexes })
    }

    return result
  },
}
