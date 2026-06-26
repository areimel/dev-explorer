use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Raw deserialization structs — match GitHub REST/GraphQL snake_case field names
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct GhUserRaw {
    login: String,
    name: Option<String>,
    avatar_url: String,
    bio: Option<String>,
    public_repos: u32,
    followers: u32,
    following: u32,
    html_url: String,
    location: Option<String>,
    company: Option<String>,
}

// ---------------------------------------------------------------------------
// Public output structs — serialized with camelCase for the frontend
// ---------------------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubProfile {
    pub login: String,
    pub name: Option<String>,
    pub avatar_url: String,
    pub bio: Option<String>,
    pub public_repos: u32,
    pub followers: u32,
    pub following: u32,
    pub html_url: String,
    pub location: Option<String>,
    pub company: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContributionDay {
    pub date: String,
    pub count: u32,
    pub level: u8,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContributionWeek {
    pub days: Vec<ContributionDay>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContributionCalendar {
    pub total_contributions: u32,
    pub weeks: Vec<ContributionWeek>,
}

// ---------------------------------------------------------------------------
// Pure mapping functions (unit-testable)
// ---------------------------------------------------------------------------

fn map_profile(raw: GhUserRaw) -> GitHubProfile {
    GitHubProfile {
        login: raw.login,
        name: raw.name,
        avatar_url: raw.avatar_url,
        bio: raw.bio,
        public_repos: raw.public_repos,
        followers: raw.followers,
        following: raw.following,
        html_url: raw.html_url,
        location: raw.location,
        company: raw.company,
    }
}

pub(crate) fn level_from_enum(s: &str) -> u8 {
    match s {
        "NONE" => 0,
        "FIRST_QUARTILE" => 1,
        "SECOND_QUARTILE" => 2,
        "THIRD_QUARTILE" => 3,
        "FOURTH_QUARTILE" => 4,
        _ => 0,
    }
}

pub(crate) fn map_calendar(json: &serde_json::Value) -> Result<ContributionCalendar, String> {
    let cal = json
        .get("data")
        .and_then(|d| d.get("user"))
        .and_then(|u| u.get("contributionsCollection"))
        .and_then(|cc| cc.get("contributionCalendar"))
        .ok_or_else(|| "Missing contributionCalendar in GraphQL response".to_string())?;

    let total = cal
        .get("totalContributions")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| "Missing totalContributions".to_string())? as u32;

    let raw_weeks = cal
        .get("weeks")
        .and_then(|w| w.as_array())
        .ok_or_else(|| "Missing weeks array".to_string())?;

    let mut weeks: Vec<ContributionWeek> = Vec::with_capacity(raw_weeks.len());
    for week in raw_weeks {
        let raw_days = week
            .get("contributionDays")
            .and_then(|d| d.as_array())
            .ok_or_else(|| "Missing contributionDays".to_string())?;

        let mut days: Vec<ContributionDay> = Vec::with_capacity(raw_days.len());
        for day in raw_days {
            let date = day
                .get("date")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing date in contributionDay".to_string())?
                .to_string();
            let count = day
                .get("contributionCount")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| "Missing contributionCount".to_string())? as u32;
            let level_str = day
                .get("contributionLevel")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "Missing contributionLevel".to_string())?;
            days.push(ContributionDay {
                date,
                count,
                level: level_from_enum(level_str),
            });
        }
        weeks.push(ContributionWeek { days });
    }

    Ok(ContributionCalendar {
        total_contributions: total,
        weeks,
    })
}

// ---------------------------------------------------------------------------
// HTTP helper — builds a reqwest client with the required headers
// ---------------------------------------------------------------------------

fn build_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent("dev-explorer")
        .build()
        .map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn github_get_profile(
    username: String,
    token: Option<String>,
) -> Result<GitHubProfile, String> {
    let client = build_client()?;

    let url = format!("https://api.github.com/users/{}", username);
    let mut req = client
        .get(&url)
        .header("Accept", "application/vnd.github+json");

    if let Some(t) = token {
        req = req.header("Authorization", format!("Bearer {}", t));
    }

    let response = req.send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("GitHub API error {}: {}", status, body));
    }

    let raw: GhUserRaw = response.json().await.map_err(|e| e.to_string())?;
    Ok(map_profile(raw))
}

#[tauri::command]
pub async fn github_get_contributions(
    username: String,
    token: String,
) -> Result<ContributionCalendar, String> {
    let client = build_client()?;

    let query = "query($login:String!){ user(login:$login){ contributionsCollection{ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount contributionLevel } } } } } }";

    let body = serde_json::json!({
        "query": query,
        "variables": { "login": username }
    });

    let response = client
        .post("https://api.github.com/graphql")
        .header("Accept", "application/vnd.github+json")
        .header("Authorization", format!("Bearer {}", token))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("GitHub GraphQL error {}: {}", status, text));
    }

    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

    // Surface GraphQL-level errors if present
    if let Some(errors) = json.get("errors") {
        return Err(format!("GraphQL errors: {}", errors));
    }

    map_calendar(&json)
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::{level_from_enum, map_calendar, map_profile, GhUserRaw};

    // --- level_from_enum ---

    #[test]
    fn test_level_none() {
        assert_eq!(level_from_enum("NONE"), 0);
    }

    #[test]
    fn test_level_first() {
        assert_eq!(level_from_enum("FIRST_QUARTILE"), 1);
    }

    #[test]
    fn test_level_second() {
        assert_eq!(level_from_enum("SECOND_QUARTILE"), 2);
    }

    #[test]
    fn test_level_third() {
        assert_eq!(level_from_enum("THIRD_QUARTILE"), 3);
    }

    #[test]
    fn test_level_fourth() {
        assert_eq!(level_from_enum("FOURTH_QUARTILE"), 4);
    }

    #[test]
    fn test_level_unknown() {
        assert_eq!(level_from_enum("SOMETHING_UNKNOWN"), 0);
    }

    // --- map_calendar ---

    fn sample_calendar_json() -> serde_json::Value {
        serde_json::json!({
            "data": {
                "user": {
                    "contributionsCollection": {
                        "contributionCalendar": {
                            "totalContributions": 42,
                            "weeks": [
                                {
                                    "contributionDays": [
                                        {
                                            "date": "2024-01-01",
                                            "contributionCount": 3,
                                            "contributionLevel": "SECOND_QUARTILE"
                                        },
                                        {
                                            "date": "2024-01-02",
                                            "contributionCount": 0,
                                            "contributionLevel": "NONE"
                                        }
                                    ]
                                },
                                {
                                    "contributionDays": [
                                        {
                                            "date": "2024-01-08",
                                            "contributionCount": 10,
                                            "contributionLevel": "FOURTH_QUARTILE"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        })
    }

    #[test]
    fn test_map_calendar_total() {
        let json = sample_calendar_json();
        let cal = map_calendar(&json).expect("map_calendar should succeed");
        assert_eq!(cal.total_contributions, 42);
    }

    #[test]
    fn test_map_calendar_week_count() {
        let json = sample_calendar_json();
        let cal = map_calendar(&json).expect("map_calendar should succeed");
        assert_eq!(cal.weeks.len(), 2);
    }

    #[test]
    fn test_map_calendar_day_count() {
        let json = sample_calendar_json();
        let cal = map_calendar(&json).expect("map_calendar should succeed");
        assert_eq!(cal.weeks[0].days[0].count, 3);
        assert_eq!(cal.weeks[0].days[0].level, 2);
    }

    #[test]
    fn test_map_calendar_fourth_quartile_day() {
        let json = sample_calendar_json();
        let cal = map_calendar(&json).expect("map_calendar should succeed");
        assert_eq!(cal.weeks[1].days[0].count, 10);
        assert_eq!(cal.weeks[1].days[0].level, 4);
    }

    #[test]
    fn test_map_calendar_missing_data() {
        let json = serde_json::json!({ "data": {} });
        assert!(map_calendar(&json).is_err());
    }

    // --- map_profile ---

    #[test]
    fn test_map_profile() {
        let raw = GhUserRaw {
            login: "octocat".to_string(),
            name: Some("The Octocat".to_string()),
            avatar_url: "https://avatars.githubusercontent.com/u/583231".to_string(),
            bio: Some("A mysterious octocat".to_string()),
            public_repos: 8,
            followers: 14000,
            following: 9,
            html_url: "https://github.com/octocat".to_string(),
            location: Some("San Francisco, CA".to_string()),
            company: Some("@github".to_string()),
        };

        let profile = map_profile(raw);
        assert_eq!(profile.login, "octocat");
        assert_eq!(profile.name, Some("The Octocat".to_string()));
        assert_eq!(profile.public_repos, 8);
        assert_eq!(profile.followers, 14000);
        assert_eq!(profile.company, Some("@github".to_string()));
    }
}
