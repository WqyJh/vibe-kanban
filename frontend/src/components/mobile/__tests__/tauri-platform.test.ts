import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the tauri-platform module fresh each test
// since it caches results
describe('tauri-platform', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('MODE', 'development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset any global state
    delete (window as any).__TAURI_INTERNALS__;
    delete (window as any).__TAURI__;
  });

  describe('isInTauri', () => {
    it('returns false in web environment', async () => {
      const { isInTauri } = await import('@/lib/tauri-platform');
      expect(isInTauri()).toBe(false);
    });

    it('returns true when __TAURI_INTERNALS__ exists', async () => {
      (window as any).__TAURI_INTERNALS__ = {};
      const { isInTauri } = await import('@/lib/tauri-platform');
      expect(isInTauri()).toBe(true);
    });

    it('returns true when __TAURI__ exists', async () => {
      (window as any).__TAURI__ = {};
      const { isInTauri } = await import('@/lib/tauri-platform');
      expect(isInTauri()).toBe(true);
    });
  });

  describe('getPlatform', () => {
    it('returns "web" when not in Tauri', async () => {
      const { getPlatform } = await import('@/lib/tauri-platform');
      expect(getPlatform()).toBe('web');
    });

    it('returns "desktop" in Tauri with standard user agent', async () => {
      (window as any).__TAURI_INTERNALS__ = {};
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      });
      const { getPlatform } = await import('@/lib/tauri-platform');
      expect(getPlatform()).toBe('desktop');
    });

    it('returns "android" in Tauri with Android user agent', async () => {
      (window as any).__TAURI_INTERNALS__ = {};
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
      });
      const { getPlatform } = await import('@/lib/tauri-platform');
      expect(getPlatform()).toBe('android');
    });

    it('returns "ios" in Tauri with iPhone user agent', async () => {
      (window as any).__TAURI_INTERNALS__ = {};
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      });
      const { getPlatform } = await import('@/lib/tauri-platform');
      expect(getPlatform()).toBe('ios');
    });

    it('returns "ios" in Tauri with iPad user agent', async () => {
      (window as any).__TAURI_INTERNALS__ = {};
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      });
      const { getPlatform } = await import('@/lib/tauri-platform');
      expect(getPlatform()).toBe('ios');
    });
  });

  describe('isMobilePlatform', () => {
    it('returns false for web', async () => {
      const { isMobilePlatform } = await import('@/lib/tauri-platform');
      expect(isMobilePlatform()).toBe(false);
    });

    it('returns true for Android in Tauri', async () => {
      (window as any).__TAURI_INTERNALS__ = {};
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
      });
      const { isMobilePlatform } = await import('@/lib/tauri-platform');
      expect(isMobilePlatform()).toBe(true);
    });

    it('returns false for desktop in Tauri', async () => {
      (window as any).__TAURI_INTERNALS__ = {};
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      });
      const { isMobilePlatform } = await import('@/lib/tauri-platform');
      expect(isMobilePlatform()).toBe(false);
    });
  });

  describe('getStorage', () => {
    it('returns LocalStorageAdapter for web', async () => {
      const { getStorage } = await import('@/lib/tauri-platform');
      const storage = getStorage();

      // Test basic localStorage operations
      await storage.setItem('test-key', 'test-value');
      const value = await storage.getItem('test-key');
      expect(value).toBe('test-value');

      await storage.removeItem('test-key');
      const removed = await storage.getItem('test-key');
      expect(removed).toBeNull();
    });
  });
});
