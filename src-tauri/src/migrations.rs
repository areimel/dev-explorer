use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_schema",
        sql: "
CREATE TABLE scan_roots (
  id          TEXT PRIMARY KEY NOT NULL,
  path        TEXT NOT NULL UNIQUE,
  label       TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE projects (
  id               TEXT PRIMARY KEY NOT NULL,
  path             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  source           TEXT NOT NULL CHECK (source IN ('scanned','manual')),
  scan_root_id     TEXT REFERENCES scan_roots(id) ON DELETE SET NULL,
  language         TEXT,
  manifests        TEXT NOT NULL DEFAULT '[]',
  last_modified_ms INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX idx_projects_scan_root_id ON projects(scan_root_id);
CREATE INDEX idx_projects_source ON projects(source);

CREATE TABLE launchers (
  id               TEXT PRIMARY KEY NOT NULL,
  name             TEXT NOT NULL,
  icon             TEXT NOT NULL,
  command_template TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);
CREATE INDEX idx_launchers_sort_order ON launchers(sort_order);

CREATE TABLE project_overrides (
  project_id  TEXT PRIMARY KEY NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE app_meta (
  key         TEXT PRIMARY KEY NOT NULL,
  value       TEXT NOT NULL,
  updated_at  INTEGER NOT NULL
);
",
        kind: MigrationKind::Up,
    }]
}
