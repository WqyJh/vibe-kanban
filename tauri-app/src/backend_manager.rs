use std::{
    io::{BufRead, BufReader},
    process::{Child, Command, Stdio},
    sync::Mutex,
};

use anyhow::{Context, Result};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

struct BackendState {
    child: Option<Child>,
    port: Option<u16>,
}

static BACKEND: Mutex<BackendState> = Mutex::new(BackendState {
    child: None,
    port: None,
});

/// Start the vibe-kanban server as a child process.
///
/// The server binary is expected to be located next to the Tauri app binary
/// in production, or built from the workspace in development.
pub fn start_backend(app: &AppHandle) -> Result<()> {
    let server_path = find_server_binary(app)?;

    tracing::info!("Starting backend from: {:?}", server_path);

    let mut child = Command::new(&server_path)
        .env("BACKEND_PORT", "0") // auto-assign port
        .env("HOST", "127.0.0.1")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .with_context(|| format!("Failed to spawn backend server at {:?}", server_path))?;

    // Read stdout to detect the assigned port
    let stdout = child.stdout.take().context("Failed to capture stdout")?;
    let reader = BufReader::new(stdout);

    // Spawn a thread to read stdout and extract the port
    let app_handle = app.clone();
    std::thread::spawn(move || {
        for line in reader.lines() {
            match line {
                Ok(line) => {
                    tracing::info!("[backend] {}", line);
                    // Look for port assignment messages
                    if let Some(port) = extract_port(&line) {
                        tracing::info!("Backend running on port {}", port);
                        store_port(&app_handle, port);
                    }
                }
                Err(e) => {
                    tracing::warn!("[backend stdout error] {}", e);
                    break;
                }
            }
        }
    });

    // Spawn a thread to read stderr
    if let Some(stderr) = child.stderr.take() {
        let err_reader = BufReader::new(stderr);
        std::thread::spawn(move || {
            for line in err_reader.lines() {
                match line {
                    Ok(line) => tracing::warn!("[backend stderr] {}", line),
                    Err(e) => {
                        tracing::warn!("[backend stderr error] {}", e);
                        break;
                    }
                }
            }
        });
    }

    let mut state = BACKEND.lock().unwrap();
    state.child = Some(child);

    Ok(())
}

/// Gracefully stop the backend process.
pub fn stop_backend(_app: &AppHandle) {
    let mut state = BACKEND.lock().unwrap();
    if let Some(mut child) = state.child.take() {
        tracing::info!("Stopping backend process (pid {})", child.id());
        let _ = child.kill();
        let _ = child.wait();
    }
}

/// Get the detected backend port, if available.
#[allow(dead_code)]
pub fn get_port() -> Option<u16> {
    BACKEND.lock().unwrap().port
}

fn find_server_binary(app: &AppHandle) -> Result<std::path::PathBuf> {
    // In development, the binary is in the workspace target directory
    // In production, it's bundled next to the app binary
    let app_dir = app
        .path()
        .resource_dir()
        .unwrap_or_else(|_| std::env::current_dir().unwrap());

    // Try production location first (bundled resource)
    let bundled = app_dir.join("server");
    if bundled.exists() {
        return Ok(bundled);
    }

    // Try development: workspace target/debug/server
    let workspace_root = app_dir
        .parent()
        .and_then(|p| p.parent())
        .unwrap_or(&app_dir);

    let dev_binary = workspace_root.join("target").join("debug").join("server");
    if dev_binary.exists() {
        return Ok(dev_binary);
    }

    // Try cargo run fallback path
    let dev_binary = workspace_root.join("target").join("release").join("server");
    if dev_binary.exists() {
        return Ok(dev_binary);
    }

    anyhow::bail!(
        "Could not find server binary. Looked in {:?} and workspace target/",
        app_dir
    )
}

fn extract_port(line: &str) -> Option<u16> {
    // The server logs: "Server running on http://127.0.0.1:PORT"
    if let Some(pos) = line.rfind(':') {
        let port_str = line[pos + 1..].trim();
        if let Ok(port) = port_str.parse::<u16>() {
            if port > 0 {
                return Some(port);
            }
        }
    }
    None
}

fn store_port(app: &AppHandle, port: u16) {
    let mut state = BACKEND.lock().unwrap();
    state.port = Some(port);

    // Also persist to Tauri store so the frontend can read it
    if let Ok(store) = app.store("vibe-kanban.json") {
        let _ = store.set("backend-port", serde_json::json!(port));
    }
}
