// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "macos")]
    {
        use objc2_foundation::{NSProcessInfo, NSString};
        NSProcessInfo::processInfo().setProcessName(&NSString::from_str("Sheetset"));
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;

            let Some(window) = app.get_webview_window("main") else {
                return Ok(());
            };
            // Fill the visible desktop so the Dock stays visible.
            if let Some(monitor) = window.current_monitor()? {
                let area = monitor.work_area();
                window.set_position(area.position)?;
                window.set_size(area.size)?;
            } else {
                window.maximize()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
