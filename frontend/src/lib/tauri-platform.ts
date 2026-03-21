/**
 * Tauri platform adaptation layer.
 *
 * In a Tauri WebView, the page origin is `tauri://localhost` (desktop) or
 * `android://` / `capacitor://` (mobile) — none of these can reach the
 * embedded backend server at `http://localhost:<port>`.
 *
 * This module patches `window.fetch` and the `WebSocket` constructor so that
 * relative URLs (e.g. `/api/...`) are automatically rewritten to absolute
 * URLs pointing at the embedded backend.  All existing code keeps working
 * unchanged.
 */

import { isTauriApp, getApiBase, getWsBase } from './tauri-env';

let _patched = false;

/**
 * Call once during app bootstrap to install the platform patches.
 * Safe to call multiple times – only patches once.
 */
export async function installTauriPlatformPatches(): Promise<void> {
  if (!isTauriApp() || _patched) return;
  _patched = true;

  const apiBase = await getApiBase();

  // --- Patch fetch -------------------------------------------------------
  const originalFetch = window.fetch;
  window.fetch = function tauriFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = apiBase + input;
    } else if (input instanceof URL && input.pathname.startsWith('/')) {
      input = new URL(input.pathname + input.search, apiBase);
    } else if (input instanceof Request && input.url.startsWith('/')) {
      input = new Request(apiBase + input.url, input);
    }
    return originalFetch.call(window, input, init);
  };

  // --- Patch WebSocket ---------------------------------------------------
  const OriginalWebSocket = window.WebSocket;
  const wsBase = apiBase.replace('http://', 'ws://');

  const TauriWebSocket = class extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      let resolvedUrl: string;
      const raw = typeof url === 'string' ? url : url.toString();

      if (raw.startsWith('/')) {
        // Relative path → resolve against WS base
        resolvedUrl = wsBase + raw;
      } else if (
        raw.startsWith('ws://localhost:') ||
        raw.startsWith('wss://localhost:')
      ) {
        // Full URL with explicit port — replace host:port with backend
        // e.g. ws://localhost:3001/api/... → ws://localhost:<backendPort>/api/...
        const pathStart = raw.indexOf('/', 5); // skip ws:// or wss://
        resolvedUrl =
          pathStart >= 0 ? wsBase + raw.substring(pathStart) : wsBase;
      } else if (
        raw.startsWith('ws://localhost') ||
        raw.startsWith('wss://localhost')
      ) {
        // ws://localhost (no port) — rewrite to backend
        const pathStart = raw.indexOf('/', 5);
        resolvedUrl =
          pathStart >= 0 ? wsBase + raw.substring(pathStart) : wsBase;
      } else {
        resolvedUrl = raw;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      super(resolvedUrl as any, protocols);
    }
  } as unknown as typeof WebSocket;

  // Preserve static properties
  Object.defineProperty(TauriWebSocket, 'CONNECTING', {
    value: OriginalWebSocket.CONNECTING,
  });
  Object.defineProperty(TauriWebSocket, 'OPEN', {
    value: OriginalWebSocket.OPEN,
  });
  Object.defineProperty(TauriWebSocket, 'CLOSING', {
    value: OriginalWebSocket.CLOSING,
  });
  Object.defineProperty(TauriWebSocket, 'CLOSED', {
    value: OriginalWebSocket.CLOSED,
  });

  window.WebSocket = TauriWebSocket;
}

/**
 * Rewrite a relative WebSocket endpoint to an absolute URL.
 * Use this for cases where you need the URL string before constructing
 * the WebSocket yourself (e.g. the PTY terminal hook).
 */
export async function resolveWsEndpoint(path: string): Promise<string> {
  const wsBase = await getWsBase();
  return wsBase + path;
}
