/**
 * IndexedDB Service Layer
 * Manages all high-volume entity data (notes, tasks, transactions, etc.)
 * Provides async CRUD with automatic connection management.
 */


interface StoreConfig {
  keyPath: string;
  indexes: Array<{ name: string; keyPath: string; unique?: boolean }>;
}

// Schema definition for all object stores
const STORE_SCHEMAS: Record<string, StoreConfig> = {
  notes: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  prompts: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  snippets: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  cheatsheet: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'category', keyPath: 'category' }, { name: '_updated', keyPath: '_updated' }] },
  kanban: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'column', keyPath: 'column' }, { name: '_updated', keyPath: '_updated' }] },
  passwords: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  bookmarks: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'category', keyPath: 'category' }, { name: '_updated', keyPath: '_updated' }] },
  diary: { keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }, { name: 'projetoId', keyPath: 'projetoId' }, { name: '_updated', keyPath: '_updated' }] },
  contacts: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  checklists: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  financialAccounts: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  financialCategories: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'type', keyPath: 'type' }, { name: '_updated', keyPath: '_updated' }] },
  financialBudgets: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'month', keyPath: 'month' }, { name: '_updated', keyPath: '_updated' }] },
  financialTransactions: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'date', keyPath: 'date' }, { name: 'categoryId', keyPath: 'categoryId' }, { name: '_updated', keyPath: '_updated' }] },
  wellnessBreaks: { keyPath: 'id', indexes: [{ name: 'dataHora', keyPath: 'dataHora' }, { name: '_updated', keyPath: '_updated' }] },
  gamificationHistory: { keyPath: 'id', indexes: [{ name: 'timestamp', keyPath: 'timestamp' }, { name: 'tipo', keyPath: 'tipo' }, { name: '_updated', keyPath: '_updated' }] },
  budgets: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'status', keyPath: 'status' }, { name: '_updated', keyPath: '_updated' }] },
  serviceCatalog: { keyPath: 'id', indexes: [{ name: '_updated', keyPath: '_updated' }] },
  stockMaterials: { keyPath: 'id', indexes: [{ name: '_updated', keyPath: '_updated' }] },
  techSheets: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  syncQueue: { keyPath: 'id', indexes: [{ name: 'timestamp', keyPath: 'timestamp' }] },
  music: { keyPath: 'id', indexes: [] },
  notifications: { keyPath: 'id', indexes: [{ name: '_updated', keyPath: '_updated' }, { name: 'read', keyPath: 'read' }] },
  wikiArticles: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'category', keyPath: 'category' }, { name: '_updated', keyPath: '_updated' }] },
  assets: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: 'category', keyPath: 'category' }, { name: '_updated', keyPath: '_updated' }] },
  activityLogs: { keyPath: 'id', indexes: [{ name: 'entityType', keyPath: 'entityType' }, { name: 'severity', keyPath: 'severity' }, { name: 'timestamp', keyPath: 'timestamp' }, { name: '_updated', keyPath: '_updated' }] },
  goals: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  habits: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  habitLogs: { keyPath: 'id', indexes: [{ name: 'habitId', keyPath: 'habitId' }, { name: 'date', keyPath: 'date' }, { name: '_updated', keyPath: '_updated' }] },
  plannerDays: { keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }, { name: '_updated', keyPath: '_updated' }] },
  wheelOfLife: { keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }, { name: '_updated', keyPath: '_updated' }] },
  moodPixels: { keyPath: 'id', indexes: [{ name: 'date', keyPath: 'date' }, { name: '_updated', keyPath: '_updated' }] },
  dreamBoard: { keyPath: 'id', indexes: [{ name: 'category', keyPath: 'category' }, { name: '_updated', keyPath: '_updated' }] },
  boards: { keyPath: 'id', indexes: [{ name: 'projectId', keyPath: 'projectId' }, { name: '_updated', keyPath: '_updated' }] },
  boardElements: { keyPath: 'id', indexes: [{ name: 'boardId', keyPath: 'boardId' }, { name: '_updated', keyPath: '_updated' }] },
};

const DB_VERSION = 7; // Incremented for Milanote-like boards
const DB_NAME = 'devCenterDB';

class DevCenterDB {
  private db: IDBDatabase | null = null;
  private openPromise: Promise<IDBDatabase> | null = null;

  /** Open (or reuse) the database connection */
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.openPromise) return this.openPromise;

    this.openPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const [storeName, config] of Object.entries(STORE_SCHEMAS)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
            for (const idx of config.indexes) {
              store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
            }
          }
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Handle unexpected close (e.g., browser upgrade)
        this.db.onclose = () => {
          this.db = null;
          this.openPromise = null;
        };
        resolve(this.db);
      };

      request.onerror = () => {
        this.openPromise = null;
        reject(request.error);
      };
    });

    return this.openPromise;
  }

  /** Get all records from a store */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /** Put (upsert) a single record */
  async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Delete a record by key */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Replace all records in a store (clear + bulkPut in single transaction) */
  async replaceAll<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Clear a single store */
  async clear(storeName: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Clear all stores (used during import) */
  async clearAll(): Promise<void> {
    const db = await this.open();
    const storeNames = Array.from(db.objectStoreNames);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      for (const name of storeNames) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Get store names for validation */
  getStoreNames(): string[] {
    return Object.keys(STORE_SCHEMAS);
  }
}

// Singleton
export const db = new DevCenterDB();
