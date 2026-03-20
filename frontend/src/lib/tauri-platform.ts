/**
 * Tauri platform detection and storage adapter.
 * Provides a unified interface for localStorage in browser
 * and Tauri Plugin Store in native app.
 */

let _isTauri: boolean | null = null;

export function isInTauri(): boolean {
  if (_isTauri !== null) return _isTauri;

  // Check for Tauri global
  _isTauri =
    typeof window !== 'undefined' &&
    (typeof (window as any).__TAURI_INTERNALS__ !== 'undefined' ||
      typeof (window as any).__TAURI__ !== 'undefined');

  return _isTauri;
}

export type Platform = 'desktop' | 'ios' | 'android' | 'web';

export function getPlatform(): Platform {
  if (!isInTauri()) return 'web';

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  return 'desktop';
}

export function isMobilePlatform(): boolean {
  const platform = getPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Storage adapter that works in both browser and Tauri environments.
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}

class TauriStoreAdapter implements StorageAdapter {
  private store: any = null;

  private async getStore() {
    if (this.store) return this.store;
    try {
      const { Store } = await import('@tauri-apps/plugin-store');
      this.store = await Store.load('vibe-kanban-settings.json');
      return this.store;
    } catch {
      console.warn('Tauri store not available, falling back to localStorage');
      return null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    const store = await this.getStore();
    if (!store) return localStorage.getItem(key);
    const val = await store.get(key);
    return val ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    const store = await this.getStore();
    if (!store) {
      localStorage.setItem(key, value);
      return;
    }
    await store.set(key, value);
    await store.save();
  }

  async removeItem(key: string): Promise<void> {
    const store = await this.getStore();
    if (!store) {
      localStorage.removeItem(key);
      return;
    }
    await store.delete(key);
    await store.save();
  }
}

let _storage: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (_storage) return _storage;
  _storage = isInTauri() ? new TauriStoreAdapter() : new LocalStorageAdapter();
  return _storage;
}
