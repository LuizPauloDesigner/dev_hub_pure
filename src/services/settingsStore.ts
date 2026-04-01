/**
 * Settings Store Adapter
 * Uses chrome.storage.local when available (Chrome Extension context),
 * falls back to localStorage with a prefix for web/preview environments.
 * Handles lightweight data: preferences, UI state, flags, small configs.
 */

const STORAGE_PREFIX = 'dcc_';

// Runtime-safe access to chrome API (avoids TS errors outside extension context)
const getChromeStorage = (): typeof chrome.storage.local | null => {
  try {
    const g = globalThis as any;
    if (g.chrome?.storage?.local) {
      return g.chrome.storage.local;
    }
  } catch {
    // Not in Chrome extension context
  }
  return null;
};

class SettingsStore {
  /** Get a single value */
  async get<T>(key: string): Promise<T | undefined> {
    const storage = getChromeStorage();
    if (storage) {
      return new Promise((resolve) => {
        storage.get(key, (result: Record<string, any>) => {
          resolve(result[key] as T | undefined);
        });
      });
    }
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  /** Get multiple values at once */
  async getMany<T extends Record<string, any>>(keys: string[]): Promise<Partial<T>> {
    const storage = getChromeStorage();
    if (storage) {
      return new Promise((resolve) => {
        storage.get(keys, (result: Record<string, any>) => {
          resolve(result as Partial<T>);
        });
      });
    }
    const result: Record<string, any> = {};
    for (const key of keys) {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (raw !== null) {
        try {
          result[key] = JSON.parse(raw);
        } catch {
          // Skip malformed entries
        }
      }
    }
    return result as Partial<T>;
  }

  /** Set a single value */
  async set(key: string, value: any): Promise<void> {
    const storage = getChromeStorage();
    if (storage) {
      return new Promise((resolve) => {
        storage.set({ [key]: value }, () => resolve());
      });
    }
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  }

  /** Set multiple values at once (batched) */
  async setMany(items: Record<string, any>): Promise<void> {
    const storage = getChromeStorage();
    if (storage) {
      return new Promise((resolve) => {
        storage.set(items, () => resolve());
      });
    }
    for (const [key, value] of Object.entries(items)) {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    }
  }

  /** Remove a single key */
  async remove(key: string): Promise<void> {
    const storage = getChromeStorage();
    if (storage) {
      return new Promise((resolve) => {
        storage.remove(key, () => resolve());
      });
    }
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  }

  /** Remove multiple keys */
  async removeMany(keys: string[]): Promise<void> {
    const storage = getChromeStorage();
    if (storage) {
      return new Promise((resolve) => {
        storage.remove(keys, () => resolve());
      });
    }
    for (const key of keys) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    }
  }
}

// Singleton
export const settingsStore = new SettingsStore();
