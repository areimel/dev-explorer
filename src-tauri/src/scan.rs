use std::time::UNIX_EPOCH;

use walkdir::WalkDir;

use crate::types::DetectedProject;

/// Directories to skip entirely during traversal.
const SKIP_DIRS: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    ".next",
    ".venv",
    "__pycache__",
    ".turbo",
    ".cache",
];

/// Manifest filenames / directory names that identify a project.
const MANIFEST_FILES: &[&str] = &[
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "Gemfile",
    "composer.json",
];

/// Identify the primary language from the manifests present.
fn detect_language(manifests: &[String]) -> Option<String> {
    // Priority order matches the spec.
    let pairs: &[(&str, &str)] = &[
        ("Cargo.toml", "rust"),
        ("package.json", "node"),
        ("pyproject.toml", "python"),
        ("go.mod", "go"),
        ("Gemfile", "ruby"),
        ("composer.json", "php"),
    ];
    for (manifest, lang) in pairs {
        if manifests.iter().any(|m| m == manifest) {
            return Some(lang.to_string());
        }
    }
    // dotnet: check for .sln / .csproj patterns
    if manifests
        .iter()
        .any(|m| m.ends_with(".sln") || m.ends_with(".csproj"))
    {
        return Some("dotnet".to_string());
    }
    None
}

/// Convert a `std::time::SystemTime` to Unix milliseconds, returning 0 on error.
fn system_time_to_ms(t: std::time::SystemTime) -> u64 {
    t.duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

#[tauri::command]
pub fn scan_root(root_path: String) -> Result<Vec<DetectedProject>, String> {
    let mut projects: Vec<DetectedProject> = Vec::new();

    let walker = WalkDir::new(&root_path)
        .max_depth(6)
        .follow_links(false)
        .into_iter();

    // We need to be able to skip entire subtrees (project dirs once matched,
    // and skip-listed dirs). WalkDir's `filter_entry` is the right tool, but
    // we also need to mark directories as "already a project" so we skip their
    // children. We do a manual iteration with `skip_current_dir`.
    let mut it = WalkDir::new(&root_path)
        .max_depth(6)
        .follow_links(false)
        .into_iter();

    // Suppress the unused-variable warning for the first walker.
    drop(walker);

    loop {
        let entry = match it.next() {
            None => break,
            Some(Err(_)) => continue, // skip unreadable entries
            Some(Ok(e)) => e,
        };

        // Only process directories.
        if !entry.file_type().is_dir() {
            continue;
        }

        let dir_name = entry.file_name().to_string_lossy();

        // Skip hidden dirs (except the root itself), and known skip-list dirs.
        if entry.depth() > 0 {
            let should_skip = SKIP_DIRS.contains(&dir_name.as_ref())
                || (dir_name.starts_with('.') && dir_name != ".git");
            if should_skip {
                it.skip_current_dir();
                continue;
            }
        }

        // Check whether this directory is a project.
        let dir_path = entry.path();
        let mut manifests: Vec<String> = Vec::new();

        // Check for .git subdirectory.
        if dir_path.join(".git").is_dir() {
            manifests.push(".git".to_string());
        }

        // Check for manifest files.
        for m in MANIFEST_FILES {
            if dir_path.join(m).exists() {
                manifests.push(m.to_string());
            }
        }

        // Check for glob-style manifests: *.sln, *.csproj
        if let Ok(entries) = std::fs::read_dir(dir_path) {
            for child in entries.flatten() {
                let child_name = child.file_name();
                let child_str = child_name.to_string_lossy();
                if child_str.ends_with(".sln") || child_str.ends_with(".csproj") {
                    manifests.push(child_str.to_string());
                }
            }
        }

        if manifests.is_empty() {
            // Not a project — recurse into it normally.
            continue;
        }

        // It's a project. Record it and skip its subtree.
        let language = detect_language(&manifests);
        let name = dir_path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| dir_path.to_string_lossy().to_string());

        let last_modified_ms = dir_path
            .metadata()
            .ok()
            .and_then(|m| m.modified().ok())
            .map(system_time_to_ms)
            .unwrap_or(0);

        projects.push(DetectedProject {
            path: dir_path.to_string_lossy().to_string(),
            name,
            manifests,
            language,
            last_modified_ms,
        });

        // Don't recurse into the project's subtree (avoids double-counting).
        it.skip_current_dir();
    }

    Ok(projects)
}
