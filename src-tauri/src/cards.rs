use std::collections::HashMap;
use std::io::Read as _;
use std::path::{Path, PathBuf};

use base64::Engine as _;
use rayon::prelude::*;

use crate::types::ProjectCardMeta;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Git's default placeholder written to `.git/description` on `git init`.
const GIT_DEFAULT_DESCRIPTION: &str =
    "Unnamed repository; edit this file 'description' to name the repository.";

/// Max bytes read from README.md.
const README_MAX_BYTES: u64 = 65_536;

/// Max bytes read from a thumbnail image (1.5 MB).
const THUMBNAIL_MAX_BYTES: u64 = 1_500_000;

/// Candidate image basenames (tried in this order, each with every extension).
const THUMBNAIL_BASENAMES: &[&str] = &[
    "logo",
    "banner",
    "icon",
    "preview",
    "screenshot",
    "social-preview",
    "og-image",
    "cover",
];

/// Image extensions tried for each basename (in priority order).
const THUMBNAIL_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "webp", "svg", "gif"];

/// Subdirectories searched after the project root (in order).
const THUMBNAIL_SUBDIRS: &[&str] = &["public", "assets", ".github", "docs", "src/assets"];

// ---------------------------------------------------------------------------
// MIME helpers
// ---------------------------------------------------------------------------

/// Return the MIME type for a known image extension, or `None`.
fn mime_for_ext(ext: &str) -> Option<&'static str> {
    match ext.to_ascii_lowercase().as_str() {
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        "webp" => Some("image/webp"),
        "gif" => Some("image/gif"),
        "svg" => Some("image/svg+xml"),
        _ => None,
    }
}

// ---------------------------------------------------------------------------
// Description helpers
// ---------------------------------------------------------------------------

/// Read the git `description` file for the given git dir (following `commondir`
/// for worktrees). Returns `None` if the file is absent, unreadable, empty, or
/// contains the default git placeholder.
fn read_git_description(git_dir: &Path) -> Option<String> {
    let desc = read_git_description_file(git_dir)
        .or_else(|| {
            // Worktree: <git_dir>/commondir may point to the main git dir.
            let commondir_path = git_dir.join("commondir");
            let common_rel = std::fs::read_to_string(&commondir_path).ok()?;
            let common_rel = common_rel.trim();
            let common_path = if Path::new(common_rel).is_absolute() {
                PathBuf::from(common_rel)
            } else {
                git_dir.join(common_rel)
            };
            read_git_description_file(&common_path)
        })?;

    Some(desc)
}

/// Read and validate a single `<dir>/description` file.
fn read_git_description_file(dir: &Path) -> Option<String> {
    let content = std::fs::read_to_string(dir.join("description")).ok()?;
    let trimmed = content.trim();
    if trimmed.is_empty() || trimmed == GIT_DEFAULT_DESCRIPTION {
        return None;
    }
    Some(trimmed.to_owned())
}

/// Read README.md from `project_root`, capped at `README_MAX_BYTES`.
/// Returns the raw content or `None`.
fn read_readme(project_root: &Path) -> Option<String> {
    let readme_path = project_root.join("README.md");
    if !readme_path.is_file() {
        return None;
    }
    std::fs::File::open(&readme_path).ok().and_then(|f| {
        let mut buf = String::new();
        f.take(README_MAX_BYTES)
            .read_to_string(&mut buf)
            .ok()
            .map(|_| buf)
    })
}

/// Strip lightweight markdown from `text` and return a plain-text excerpt of
/// at most `max_chars` characters, truncated on a word boundary with `…`.
///
/// Stripping rules (good-enough, not a full parser):
/// - Skip leading blank lines.
/// - Skip a leading `# Title` heading line.
/// - Skip fenced code blocks (lines between ``` fences).
/// - Skip HTML comment lines (`<!-- ... -->`).
/// - Convert `[label](url)` → `label`, drop `![alt](url)`.
/// - Remove heading markers `#`.
/// - Remove emphasis markers `*`, `_`, `` ` ``.
/// - Collapse whitespace/newlines to single spaces.
pub(crate) fn markdown_excerpt(text: &str, max_chars: usize) -> Option<String> {
    let mut in_fence = false;
    let mut skipped_heading = false;
    let mut parts: Vec<&str> = Vec::new();

    for line in text.lines() {
        let trimmed = line.trim();

        // Fenced code block toggle.
        if trimmed.starts_with("```") || trimmed.starts_with("~~~") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence {
            continue;
        }

        // HTML comment lines (single-line only).
        if trimmed.starts_with("<!--") {
            continue;
        }

        // Skip blank lines at the very start (before we have any content).
        if trimmed.is_empty() {
            if parts.is_empty() {
                continue;
            }
            // A blank line after content ends the first paragraph — stop here.
            break;
        }

        // Skip a leading `# Heading` line (the title).
        if !skipped_heading && trimmed.starts_with('#') {
            skipped_heading = true;
            continue;
        }

        parts.push(line);
    }

    if parts.is_empty() {
        return None;
    }

    // Join lines into a single string and apply inline stripping.
    let joined = parts.join(" ");
    let stripped = strip_inline_markdown(&joined);

    // Collapse whitespace.
    let collapsed: String = stripped
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    if collapsed.is_empty() {
        return None;
    }

    Some(truncate_words(&collapsed, max_chars))
}

/// Remove inline markdown: images, links, heading `#`, emphasis `* _ \``.
pub(crate) fn strip_inline_markdown(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let chars: Vec<char> = s.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // `![alt](url)` — drop entirely.
        if chars[i] == '!' && i + 1 < len && chars[i + 1] == '[' {
            if let Some(end) = find_markdown_link_end(&chars, i + 1) {
                i = end;
                continue;
            }
        }

        // `[label](url)` → `label`.
        if chars[i] == '[' {
            if let Some((label, end)) = extract_markdown_link_label(&chars, i) {
                out.push_str(&label);
                i = end;
                continue;
            }
        }

        // Heading markers at start: strip `#` characters followed by space.
        if chars[i] == '#' {
            // Skip all leading `#` and the following space.
            while i < len && chars[i] == '#' {
                i += 1;
            }
            if i < len && chars[i] == ' ' {
                i += 1;
            }
            continue;
        }

        // Emphasis / code markers.
        if chars[i] == '*' || chars[i] == '_' || chars[i] == '`' {
            i += 1;
            continue;
        }

        out.push(chars[i]);
        i += 1;
    }

    out
}

/// Find the end index (exclusive) of a markdown link/image starting at `[`.
fn find_markdown_link_end(chars: &[char], bracket_start: usize) -> Option<usize> {
    // Find closing `]`.
    let close_bracket = chars[bracket_start..]
        .iter()
        .position(|&c| c == ']')
        .map(|p| bracket_start + p)?;
    // Must be followed by `(`.
    if close_bracket + 1 >= chars.len() || chars[close_bracket + 1] != '(' {
        return None;
    }
    // Find closing `)`.
    let close_paren = chars[close_bracket + 2..]
        .iter()
        .position(|&c| c == ')')
        .map(|p| close_bracket + 2 + p)?;
    Some(close_paren + 1)
}

/// Extract `label` from `[label](url)`, return `(label_string, end_index)`.
fn extract_markdown_link_label(chars: &[char], bracket_start: usize) -> Option<(String, usize)> {
    let end = find_markdown_link_end(chars, bracket_start)?;
    let close_bracket = chars[bracket_start..]
        .iter()
        .position(|&c| c == ']')
        .map(|p| bracket_start + p)?;
    let label: String = chars[bracket_start + 1..close_bracket].iter().collect();
    Some((label, end))
}

/// Truncate `s` to at most `max_chars` on a word boundary, appending `…`.
pub(crate) fn truncate_words(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        return s.to_owned();
    }
    // Walk chars until we exceed the limit.
    let mut last_space = 0usize;
    let mut count = 0usize;
    for (byte_idx, ch) in s.char_indices() {
        if count >= max_chars {
            let cut = if last_space > 0 { last_space } else { byte_idx };
            return format!("{}…", s[..cut].trim_end());
        }
        if ch == ' ' {
            last_space = byte_idx;
        }
        count += 1;
    }
    s.to_owned()
}

// ---------------------------------------------------------------------------
// Thumbnail helpers
// ---------------------------------------------------------------------------

/// Return a `data:<mime>;base64,<b64>` URI for `path`, or `None` if the file
/// is absent, too large, or has an unrecognised extension.
fn load_image_as_data_uri(path: &Path) -> Option<String> {
    let ext = path.extension()?.to_string_lossy().to_ascii_lowercase();
    let mime = mime_for_ext(&ext)?;

    let metadata = std::fs::metadata(path).ok()?;
    if !metadata.is_file() || metadata.len() > THUMBNAIL_MAX_BYTES {
        return None;
    }

    let bytes = std::fs::read(path).ok()?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Some(format!("data:{};base64,{}", mime, b64))
}

/// Try every (basename, extension) pair inside `dir`.
fn probe_dir_for_thumbnail(dir: &Path) -> Option<String> {
    for basename in THUMBNAIL_BASENAMES {
        for ext in THUMBNAIL_EXTENSIONS {
            let candidate = dir.join(format!("{}.{}", basename, ext));
            if let Some(uri) = load_image_as_data_uri(&candidate) {
                return Some(uri);
            }
        }
    }
    None
}

/// Check the project root then each subdirectory for a known thumbnail image.
fn find_thumbnail_in_tree(project_root: &Path) -> Option<String> {
    // 1. Project root.
    if let Some(uri) = probe_dir_for_thumbnail(project_root) {
        return Some(uri);
    }

    // 2. Known subdirectories.
    for subdir in THUMBNAIL_SUBDIRS {
        let dir = project_root.join(subdir);
        if dir.is_dir() {
            if let Some(uri) = probe_dir_for_thumbnail(&dir) {
                return Some(uri);
            }
        }
    }

    None
}

/// Extract the first local image path from a README string (markdown or HTML).
fn first_local_image_path(readme: &str) -> Option<String> {
    // Try markdown `![alt](path)` first.
    if let Some(path) = first_markdown_image(readme) {
        return Some(path);
    }
    // Then HTML `<img src="path">`.
    first_html_img_src(readme)
}

/// Find the first `![alt](path)` where `path` is a local relative path.
fn first_markdown_image(text: &str) -> Option<String> {
    let chars: Vec<char> = text.chars().collect();
    let len = chars.len();
    let mut i = 0;
    while i < len {
        if chars[i] == '!' && i + 1 < len && chars[i + 1] == '[' {
            if let Some(end) = find_markdown_link_end(&chars, i + 1) {
                // `find_markdown_link_end` succeeded so `]` must exist; use
                // `if let` to avoid propagating `None` out of the loop.
                if let Some(close_bracket) = chars[i + 1..]
                    .iter()
                    .position(|&c| c == ']')
                    .map(|p| i + 1 + p)
                {
                    // URL starts two chars after `]` (skip `(`), ends before `)`.
                    let url_start = close_bracket + 2;
                    let url_end = end - 1;
                    if url_start < url_end {
                        let url: String = chars[url_start..url_end].iter().collect();
                        if is_local_path(&url) {
                            return Some(url);
                        }
                    }
                }
                i = end;
                continue;
            }
        }
        i += 1;
    }
    None
}

/// Find the first `<img src="path">` or `<img src='path'>` where `path` is local.
fn first_html_img_src(text: &str) -> Option<String> {
    let lower = text.to_ascii_lowercase();
    let mut search_from = 0;
    while let Some(img_pos) = lower[search_from..].find("<img") {
        let abs_pos = search_from + img_pos;
        // Find end of the tag.
        let tag_end = lower[abs_pos..].find('>').map(|p| abs_pos + p)?;
        let tag = &text[abs_pos..=tag_end];
        let tag_lower = &lower[abs_pos..=tag_end];

        if let Some(src_pos) = tag_lower.find("src=") {
            let after_eq = src_pos + 4;
            let bytes = tag.as_bytes();
            let after_eq_bytes = &bytes[after_eq..];
            let (quote, start) = if after_eq_bytes.first() == Some(&b'"') {
                (b'"', after_eq + 1)
            } else if after_eq_bytes.first() == Some(&b'\'') {
                (b'\'', after_eq + 1)
            } else {
                search_from = tag_end + 1;
                continue;
            };

            let tag_bytes = tag.as_bytes();
            if let Some(close) = tag_bytes[start..].iter().position(|&b| b == quote) {
                let url = &tag[start..start + close];
                if is_local_path(url) {
                    return Some(url.to_owned());
                }
            }
        }
        search_from = tag_end + 1;
    }
    None
}

/// Return `true` if `url` is a relative local path (not http/https/data).
fn is_local_path(url: &str) -> bool {
    let lower = url.to_ascii_lowercase();
    !lower.starts_with("http://")
        && !lower.starts_with("https://")
        && !lower.starts_with("data:")
        && !lower.is_empty()
}

/// Try loading the first local image referenced in `readme_content`.
fn thumbnail_from_readme(project_root: &Path, readme_content: &str) -> Option<String> {
    let rel_path = first_local_image_path(readme_content)?;
    let abs_path = project_root.join(&rel_path);
    // Security: ensure resolved path is inside the project root.
    let canonical_img = std::fs::canonicalize(&abs_path).ok()?;
    let canonical_root = std::fs::canonicalize(project_root).ok()?;
    if !canonical_img.starts_with(&canonical_root) {
        return None;
    }
    load_image_as_data_uri(&canonical_img)
}

// ---------------------------------------------------------------------------
// Per-project computation
// ---------------------------------------------------------------------------

/// Compute `ProjectCardMeta` for a single project directory.
/// Never panics — all errors result in `None` fields.
fn meta_for(path: &str) -> ProjectCardMeta {
    let project_root = Path::new(path);

    // --- Description ---
    let description = description_for(project_root);

    // --- Thumbnail ---
    let thumbnail_data_uri = thumbnail_for(project_root);

    ProjectCardMeta {
        path: path.to_owned(),
        description,
        thumbnail_data_uri,
    }
}

/// Resolve the description: git description → README excerpt → None.
fn description_for(project_root: &Path) -> Option<String> {
    // 1. Git description file.
    if let Some(git_dir) = crate::git::resolve_git_dir(project_root) {
        if let Some(desc) = read_git_description(&git_dir) {
            return Some(desc);
        }
    }

    // 2. README.md excerpt.
    let readme = read_readme(project_root)?;
    markdown_excerpt(&readme, 150)
}

/// Resolve the thumbnail: tree scan → README image → None.
fn thumbnail_for(project_root: &Path) -> Option<String> {
    // 1. Known candidate files in the tree.
    if let Some(uri) = find_thumbnail_in_tree(project_root) {
        return Some(uri);
    }

    // 2. First local image in README.
    let readme = read_readme(project_root)?;
    thumbnail_from_readme(project_root, &readme)
}

// ---------------------------------------------------------------------------
// Tauri command
// ---------------------------------------------------------------------------

/// Batched command: returns `ProjectCardMeta` for each supplied path.
/// Results are keyed by path. Never errors per-item — failures surface as
/// `None` fields inside the returned struct.
#[tauri::command]
pub async fn get_project_cards_meta(
    paths: Vec<String>,
) -> Result<HashMap<String, ProjectCardMeta>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        paths
            .par_iter()
            .map(|p| (p.clone(), meta_for(p)))
            .collect::<HashMap<String, ProjectCardMeta>>()
    })
    .await
    .map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::{
        markdown_excerpt, mime_for_ext, strip_inline_markdown, truncate_words,
        GIT_DEFAULT_DESCRIPTION,
    };

    // --- mime_for_ext ---

    #[test]
    fn test_mime_png() {
        assert_eq!(mime_for_ext("png"), Some("image/png"));
    }

    #[test]
    fn test_mime_jpg() {
        assert_eq!(mime_for_ext("jpg"), Some("image/jpeg"));
    }

    #[test]
    fn test_mime_jpeg() {
        assert_eq!(mime_for_ext("jpeg"), Some("image/jpeg"));
    }

    #[test]
    fn test_mime_webp() {
        assert_eq!(mime_for_ext("webp"), Some("image/webp"));
    }

    #[test]
    fn test_mime_gif() {
        assert_eq!(mime_for_ext("gif"), Some("image/gif"));
    }

    #[test]
    fn test_mime_svg() {
        assert_eq!(mime_for_ext("svg"), Some("image/svg+xml"));
    }

    #[test]
    fn test_mime_unknown() {
        assert_eq!(mime_for_ext("bmp"), None);
        assert_eq!(mime_for_ext(""), None);
    }

    #[test]
    fn test_mime_case_insensitive() {
        assert_eq!(mime_for_ext("PNG"), Some("image/png"));
        assert_eq!(mime_for_ext("JPG"), Some("image/jpeg"));
    }

    // --- git description placeholder detection ---

    #[test]
    fn test_git_default_description_constant() {
        // Ensure the constant matches git's exact default.
        assert_eq!(
            GIT_DEFAULT_DESCRIPTION,
            "Unnamed repository; edit this file 'description' to name the repository."
        );
    }

    #[test]
    fn test_placeholder_detected() {
        let raw = format!("  {}  \n", GIT_DEFAULT_DESCRIPTION);
        let trimmed = raw.trim();
        assert_eq!(trimmed, GIT_DEFAULT_DESCRIPTION);
    }

    // --- truncate_words ---

    #[test]
    fn test_truncate_short() {
        assert_eq!(truncate_words("hello world", 50), "hello world");
    }

    #[test]
    fn test_truncate_exact() {
        let s = "hello";
        assert_eq!(truncate_words(s, 5), "hello");
    }

    #[test]
    fn test_truncate_word_boundary() {
        let s = "hello world foo bar";
        // 11 chars cuts between "world" and "foo".
        let result = truncate_words(s, 11);
        assert!(result.ends_with('…'));
        assert!(!result.contains("foo"));
    }

    #[test]
    fn test_truncate_appends_ellipsis() {
        let s = "the quick brown fox jumps over the lazy dog";
        let result = truncate_words(s, 15);
        assert!(result.ends_with('…'));
        assert!(result.len() < s.len());
    }

    // --- strip_inline_markdown ---

    #[test]
    fn test_strip_bold_asterisks() {
        assert_eq!(strip_inline_markdown("**bold**"), "bold");
    }

    #[test]
    fn test_strip_italic_underscore() {
        assert_eq!(strip_inline_markdown("_italic_"), "italic");
    }

    #[test]
    fn test_strip_inline_code() {
        assert_eq!(strip_inline_markdown("`code`"), "code");
    }

    #[test]
    fn test_strip_link() {
        assert_eq!(
            strip_inline_markdown("[label](https://example.com)"),
            "label"
        );
    }

    #[test]
    fn test_strip_image() {
        assert_eq!(strip_inline_markdown("![alt](image.png)"), "");
    }

    #[test]
    fn test_strip_heading_hashes() {
        // `## Hello` → strip both `#` chars and the following space → `Hello`.
        assert_eq!(strip_inline_markdown("## Hello"), "Hello");
    }

    #[test]
    fn test_strip_mixed() {
        assert_eq!(
            strip_inline_markdown("Check [this](http://x.com) out: **great**"),
            "Check this out: great"
        );
    }

    // --- markdown_excerpt ---

    #[test]
    fn test_excerpt_skips_h1_heading() {
        let md = "# My Project\n\nThis is the description.";
        let result = markdown_excerpt(md, 200).unwrap();
        assert!(!result.contains("My Project"));
        assert!(result.contains("This is the description"));
    }

    #[test]
    fn test_excerpt_skips_code_fence() {
        let md = "Intro\n```\ncode here\n```\nmore text";
        let result = markdown_excerpt(md, 200).unwrap();
        assert!(!result.contains("code here"));
        assert!(result.contains("Intro"));
    }

    #[test]
    fn test_excerpt_truncates_at_word_boundary() {
        let md = "# Title\n\nThis is a fairly long description that should be truncated at a reasonable word boundary.";
        let result = markdown_excerpt(md, 30).unwrap();
        assert!(result.ends_with('…'));
        assert!(result.chars().count() <= 35); // Some slack for the ellipsis.
    }

    #[test]
    fn test_excerpt_empty_readme() {
        assert_eq!(markdown_excerpt("", 150), None);
    }

    #[test]
    fn test_excerpt_only_heading() {
        assert_eq!(markdown_excerpt("# Title\n", 150), None);
    }

    #[test]
    fn test_excerpt_stops_at_blank_line() {
        let md = "First paragraph.\n\nSecond paragraph.";
        let result = markdown_excerpt(md, 200).unwrap();
        assert!(result.contains("First paragraph"));
        assert!(!result.contains("Second paragraph"));
    }

    #[test]
    fn test_excerpt_strips_links() {
        let md = "See [docs](https://example.com) for details.";
        let result = markdown_excerpt(md, 200).unwrap();
        assert!(!result.contains("https://example.com"));
        assert!(result.contains("docs"));
    }
}
