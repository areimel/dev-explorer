use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedProject {
    pub path: String,
    pub name: String,
    pub manifests: Vec<String>,
    pub language: Option<String>,
    pub last_modified_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDetails {
    pub path: String,
    pub manifests: Vec<String>,
    pub readme_markdown: Option<String>,
    pub last_modified_ms: u64,
}
