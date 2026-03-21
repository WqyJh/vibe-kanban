mod backend_manager;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "vibe_kanban_app=info".into()),
        )
        .init();

    let builder = tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init());

    // Desktop-only plugin: window state persistence
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

    builder
        // Setup
        .setup(|app| {
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                // Desktop: start the embedded backend process
                let handle = app.handle().clone();
                backend_manager::start_backend(&handle)?;
            }

            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let _ = app.deep_link().register_all();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    // Gracefully stop the backend when the window closes
                    let handle = window.app_handle().clone();
                    backend_manager::stop_backend(&handle);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
