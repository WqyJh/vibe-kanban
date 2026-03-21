/**
 * Detects whether the app is running inside a Tauri WebView.
 * Provides the backend API base URL for Tauri environments.
 */

const TAURI_INTERNAL_PREFIX = '__TAURI_INTERNALS__';
const TAURI_STORE_KEY = 'vibe-kanban-backend-port';

let _isTauri: boolean | undefined;
let _apiBase: string | undefined;

/**
 * Check if we're running inside Tauri WebView.
 */
export function isTauriApp(): boolean {
  if (_isTauri === undefined) {
    _isTauri =
      typeof window !== 'undefined' &&
      (TAURI_INTERNAL_PREFIX in window ||
        // @ts-expect-error — Tauri global
        typeof window.__TAURI__ !== 'undefined');
  }
  return _isTauri;
}

/**
 * Get the API base URL for the Tauri-embedded backend.
 *
 * In Tauri mode, the backend is a child process bound to a local port.
 * The port is stored in the Tauri store by the backend_manager after
 * the server starts. We poll the store on first access.
 *
 * Falls back to the default port if the store hasn't been populated yet.
 */
export async function getApiBase(): Promise<string> {
  if (!isTauriApp()) {
    return '';
  }

  if (_apiBase) {
    return _apiBase;
  }

  // Try reading port from Tauri store
  try {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('vibe-kanban.json');
    const port = await store.get<number>(TAURI_STORE_KEY);
    if (port && typeof port === 'number') {
      _apiBase = `http://localhost:${port}`;
      return _apiBase;
    }
  } catch {
    // Store not ready yet
  }

  // Fallback: try reading from env (set during dev)
  _apiBase = 'http://localhost:3001';
  return _apiBase;
}

/**
 * Reset cached API base (e.g. if backend restarts).
 */
export function resetApiBase(): void {
  _apiBase = undefined;
}

/**
 * Get the WebSocket URL for the Tauri-embedded backend.
 */
export async function getWsBase(): Promise<string> {
  const apiBase = await getApiBase();
  return apiBase.replace('http://', 'ws://');
}
