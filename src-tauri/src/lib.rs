mod cards;
mod details;
mod git;
mod launch;
mod migrations;
mod scan;
mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:devexplorer.db", migrations::migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            scan::scan_root,
            details::read_project_details,
            launch::open_with_launcher,
            launch::reveal_in_explorer,
            git::get_git_statuses,
            cards::get_project_cards_meta,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
