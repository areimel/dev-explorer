use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use rayon::prelude::*;

use crate::types::GitStatus;

/// The "not a repo" sentinel value.
fn not_a_repo() -> GitStatus {
    GitStatus {
        is_repo: false,
        branch: None,
        is_dirty: false,
        detached: false,
    }
}

/// Parse a `gitdir: <path>` line from a `.git` file (worktree / submodule).
/// Returns `Some(path_str)` on success, `None` otherwise.
pub fn parse_gitdir_file(content: &str) -> Option<String> {
    let line = content.lines().next()?.trim();
    let rest = line.strip_prefix("gitdir:")?;
    Some(rest.trim().to_owned())
}

/// Parse HEAD content into (branch, detached).
/// - `ref: refs/heads/<name>` → (Some(name), false)
/// - 40-char hex SHA → (Some(first-7-chars), true)
/// - anything else → (None, false)
pub fn parse_head(content: &str) -> (Option<String>, bool) {
    let trimmed = content.trim();
    if let Some(rest) = trimmed.strip_prefix("ref: refs/heads/") {
        return (Some(rest.trim().to_owned()), false);
    }
    // Detached HEAD: 40-char lowercase hex
    if trimmed.len() >= 40 && trimmed[..40].chars().all(|c| c.is_ascii_hexdigit()) {
        return (Some(trimmed[..7].to_owned()), true);
    }
    (None, false)
}

/// Resolve the actual git directory for a project path.
/// Returns `None` if this is not a git repo.
pub(crate) fn resolve_git_dir(project_path: &Path) -> Option<PathBuf> {
    let dot_git = project_path.join(".git");

    if dot_git.is_dir() {
        // Normal repo: .git is a directory.
        return Some(dot_git);
    }

    if dot_git.is_file() {
        // Worktree or submodule: .git is a file containing `gitdir: <path>`.
        let content = std::fs::read_to_string(&dot_git).ok()?;
        let gitdir_str = parse_gitdir_file(&content)?;
        let gitdir_path = Path::new(&gitdir_str);
        if gitdir_path.is_absolute() {
            return Some(gitdir_path.to_path_buf());
        }
        // Relative paths are resolved relative to the project directory.
        return Some(project_path.join(gitdir_path));
    }

    None
}

/// Determine whether the working tree is dirty by running
/// `git -C <path> status --porcelain --untracked-files=normal --ignore-submodules`.
/// Any failure (git not installed, non-zero exit) is silently treated as clean.
fn is_dirty(project_path: &Path) -> bool {
    let mut cmd = Command::new("git");
    cmd.args([
        "-C",
        &project_path.to_string_lossy(),
        "status",
        "--porcelain",
        "--untracked-files=normal",
        "--ignore-submodules",
    ]);

    // On Windows, suppress the console window flash.
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

    match cmd.output() {
        Ok(out) if out.status.success() => !out.stdout.is_empty(),
        _ => false,
    }
}

/// Compute the git status for a single project directory.
/// Never returns an error — a bad/non-repo path yields a `not_a_repo()` value.
fn status_for(path: &str) -> GitStatus {
    let project_path = Path::new(path);

    let git_dir = match resolve_git_dir(project_path) {
        Some(d) => d,
        None => return not_a_repo(),
    };

    let head_path = git_dir.join("HEAD");
    let head_content = match std::fs::read_to_string(&head_path) {
        Ok(c) => c,
        Err(_) => return not_a_repo(),
    };

    let (branch, detached) = parse_head(&head_content);
    let dirty = is_dirty(project_path);

    GitStatus {
        is_repo: true,
        branch,
        is_dirty: dirty,
        detached,
    }
}

/// Tauri command: returns git status for each path in one batched, parallel call.
#[tauri::command]
pub async fn get_git_statuses(paths: Vec<String>) -> Result<HashMap<String, GitStatus>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        paths
            .par_iter()
            .map(|p| (p.clone(), status_for(p)))
            .collect::<HashMap<String, GitStatus>>()
    })
    .await
    .map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::{parse_gitdir_file, parse_head};

    // --- parse_head ---

    #[test]
    fn test_parse_head_normal_ref() {
        let (branch, detached) = parse_head("ref: refs/heads/main\n");
        assert_eq!(branch, Some("main".to_owned()));
        assert!(!detached);
    }

    #[test]
    fn test_parse_head_feature_branch() {
        let (branch, detached) = parse_head("ref: refs/heads/feature/my-branch\n");
        assert_eq!(branch, Some("feature/my-branch".to_owned()));
        assert!(!detached);
    }

    #[test]
    fn test_parse_head_detached_sha() {
        let sha = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
        let (branch, detached) = parse_head(sha);
        assert_eq!(branch, Some("a1b2c3d".to_owned()));
        assert!(detached);
    }

    #[test]
    fn test_parse_head_detached_sha_trailing_newline() {
        let sha = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef\n";
        let (branch, detached) = parse_head(sha);
        assert_eq!(branch, Some("deadbee".to_owned()));
        assert!(detached);
    }

    #[test]
    fn test_parse_head_garbage() {
        let (branch, detached) = parse_head("not a valid head\n");
        assert_eq!(branch, None);
        assert!(!detached);
    }

    #[test]
    fn test_parse_head_empty() {
        let (branch, detached) = parse_head("");
        assert_eq!(branch, None);
        assert!(!detached);
    }

    #[test]
    fn test_parse_head_whitespace_only() {
        let (branch, detached) = parse_head("   \n  ");
        assert_eq!(branch, None);
        assert!(!detached);
    }

    // --- parse_gitdir_file ---

    #[test]
    fn test_parse_gitdir_file_standard() {
        let content = "gitdir: ../.git/worktrees/my-worktree\n";
        assert_eq!(
            parse_gitdir_file(content),
            Some("../.git/worktrees/my-worktree".to_owned())
        );
    }

    #[test]
    fn test_parse_gitdir_file_absolute() {
        let content = "gitdir: /home/user/repo/.git\n";
        assert_eq!(
            parse_gitdir_file(content),
            Some("/home/user/repo/.git".to_owned())
        );
    }

    #[test]
    fn test_parse_gitdir_file_no_prefix() {
        let content = "not a gitdir file\n";
        assert_eq!(parse_gitdir_file(content), None);
    }

    #[test]
    fn test_parse_gitdir_file_empty() {
        assert_eq!(parse_gitdir_file(""), None);
    }
}
