use std::time::UNIX_EPOCH;

use crate::types::ProjectDetails;

const MANIFEST_NAMES: &[&str] = &[
    ".git",
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "Gemfile",
    "composer.json",
    "README.md",
];

/// Max bytes read from README.md (~64 KB).
const README_MAX_BYTES: u64 = 65_536;

fn system_time_to_ms(t: std::time::SystemTime) -> u64 {
    t.duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

#[tauri::command]
pub fn read_project_details(path: String) -> Result<ProjectDetails, String> {
    let dir = std::path::Path::new(&path);

    if !dir.is_dir() {
        return Err(format!("Not a directory: {path}"));
    }

    let mut manifests: Vec<String> = Vec::new();

    // Check named manifests.
    for name in MANIFEST_NAMES {
        let candidate = dir.join(name);
        if candidate.exists() {
            manifests.push(name.to_string());
        }
    }

    // Check for *.sln and *.csproj.
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let fname = entry.file_name();
            let s = fname.to_string_lossy();
            if s.ends_with(".sln") || s.ends_with(".csproj") {
                if !manifests.contains(&s.to_string()) {
                    manifests.push(s.to_string());
                }
            }
        }
    }

    // Read README.md if present (capped at README_MAX_BYTES).
    let readme_path = dir.join("README.md");
    let readme_markdown = if readme_path.is_file() {
        use std::io::Read as _;
        std::fs::File::open(&readme_path).ok().and_then(|f| {
            let mut buf = String::new();
            let mut limited = f.take(README_MAX_BYTES);
            limited.read_to_string(&mut buf).ok().map(|_| buf)
        })
    } else {
        None
    };

    let last_modified_ms = dir
        .metadata()
        .ok()
        .and_then(|m| m.modified().ok())
        .map(system_time_to_ms)
        .unwrap_or(0);

    Ok(ProjectDetails {
        path,
        manifests,
        readme_markdown,
        last_modified_ms,
    })
}
