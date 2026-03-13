import type { PatchTypeWithKey } from '@/hooks/useConversationHistory/types';

const DB_NAME = 'vibe-kanban-conversation-cache';
const DB_VERSION = 1;
const STORE_NAME = 'process-entries';

interface CachedProcessEntries {
  processId: string;
  attemptId: string;
  entries: PatchTypeWithKey[];
  totalCount: number;
  cachedAt: number;
}


let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInitPromise = null;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for cached process entries
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: ['attemptId', 'processId'],
        });
        store.createIndex('attemptId', 'attemptId', { unique: false });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
      }
    };
  });

  return dbInitPromise;
}

/**
 * Get cached entries for a process
 */
export async function getCachedProcessEntries(
  attemptId: string,
  processId: string
): Promise<CachedProcessEntries | null> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get([attemptId, processId]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        console.warn('Failed to get cached entries:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('IndexedDB error in getCachedProcessEntries:', error);
    return null;
  }
}

/**
 * Store entries for a process in the cache
 */
export async function setCachedProcessEntries(
  attemptId: string,
  processId: string,
  entries: PatchTypeWithKey[],
  totalCount: number
): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cached: CachedProcessEntries = {
      processId,
      attemptId,
      entries,
      totalCount,
      cachedAt: Date.now(),
    };

    return new Promise((resolve) => {
      const request = store.put(cached);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to cache entries:', request.error);
        resolve(); // Don't reject, caching is best-effort
      };
    });
  } catch (error) {
    console.warn('IndexedDB error in setCachedProcessEntries:', error);
  }
}

/**
 * Clear all cached entries for an attempt
 */
export async function clearCachedEntriesForAttempt(
  attemptId: string
): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('attemptId');

    return new Promise((resolve) => {
      const request = index.openCursor(IDBKeyRange.only(attemptId));

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        console.warn('Failed to clear cached entries:', request.error);
        resolve();
      };
    });
  } catch (error) {
    console.warn('IndexedDB error in clearCachedEntriesForAttempt:', error);
  }
}

/**
 * Clear all cached entries
 */
export async function clearAllCachedEntries(): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('Failed to clear all cached entries:', request.error);
        resolve();
      };
    });
  } catch (error) {
    console.warn('IndexedDB error in clearAllCachedEntries:', error);
  }
}

/**
 * Check if cached data is stale (older than maxAgeMs)
 */
export function isCacheStale(cachedAt: number, maxAgeMs: number = 60 * 60 * 1000): boolean {
  return Date.now() - cachedAt > maxAgeMs;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSizeEstimate: number;
}> {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.count();
      request.onsuccess = () => {
        // Rough estimate: assume average 500 bytes per entry
        const count = request.result;
        resolve({
          totalEntries: count,
          totalSizeEstimate: count * 500,
        });
      };
      request.onerror = () => {
        console.warn('Failed to get cache stats:', request.error);
        resolve({ totalEntries: 0, totalSizeEstimate: 0 });
      };
    });
  } catch (error) {
    console.warn('IndexedDB error in getCacheStats:', error);
    return { totalEntries: 0, totalSizeEstimate: 0 };
  }
}
