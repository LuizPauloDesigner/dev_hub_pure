/**
 * Unified Storage Service
 * Orchestrates IndexedDB (entities) + SettingsStore (config) + in-memory cache.
 * Provides debounced incremental writes, automatic migration from localStorage,
 * and a clean API for the AppContext to consume.
 */

import { db } from './db';
import { settingsStore } from './settingsStore';
import type { AppState } from '@/contexts/AppContext';

// For real-time sync between tabs
const syncChannel = new BroadcastChannel('devcenter-sync');

// ─── Entity Mapping ─────────────────────────────────────────────────────────
// Maps IDB store names to their accessor functions on AppState.
// Used for both loading (reconstructing state) and saving (diffing).

interface EntityMapping {
  store: string;
  get: (state: AppState) => any[];
}

export const ENTITY_MAP: EntityMapping[] = [
  { store: 'notes', get: (s) => s.notes },
  { store: 'prompts', get: (s) => s.prompts },
  { store: 'snippets', get: (s) => s.snippets },
  { store: 'cheatsheet', get: (s) => s.cheatsheet },
  { store: 'kanban', get: (s) => s.kanban },
  { store: 'passwords', get: (s) => s.passwords },
  { store: 'bookmarks', get: (s) => s.bookmarks },
  { store: 'diary', get: (s) => s.diary },
  { store: 'contacts', get: (s) => s.contacts },
  { store: 'checklists', get: (s) => s.checklists },
  { store: 'financialAccounts', get: (s) => s.financialAccounts },
  { store: 'financialCategories', get: (s) => s.financialCategories },
  { store: 'financialBudgets', get: (s) => s.financialBudgets },
  { store: 'financialTransactions', get: (s) => s.financialTransactions },
  { store: 'wellnessBreaks', get: (s) => s.wellnessStats.breaks },
  { store: 'gamificationHistory', get: (s) => s.gamificationStats.historico },
  { store: 'budgets', get: (s) => s.budgets },
  { store: 'serviceCatalog', get: (s) => s.serviceCatalog },
  { store: 'stockMaterials', get: (s) => s.stockMaterials },
  { store: 'techSheets', get: (s) => s.techSheets },
  { store: 'notifications', get: (s) => s.notifications },
  { store: 'wikiArticles', get: (s) => s.wikiArticles },
  { store: 'assets', get: (s) => s.assets },
  { store: 'activityLogs', get: (s) => s.activityLogs },
  { store: 'goals', get: (s) => s.goals },
  { store: 'habits', get: (s) => s.habits },
  { store: 'habitLogs', get: (s) => s.habitLogs },
  { store: 'plannerDays', get: (s) => s.plannerDays },
  { store: 'wheelOfLife', get: (s) => s.wheelOfLife },
  { store: 'moodPixels', get: (s) => s.moodPixels },
  { store: 'dreamBoard', get: (s) => s.dreamBoard },
  { store: 'boards', get: (s) => s.boards },
  { store: 'boardElements', get: (s) => s.boardElements },
  { store: 'boardConnections', get: (s) => s.boardConnections },
];

// Settings keys that map directly from AppState
const SETTINGS_KEYS = [
  'projects', 'pomodoroStats', 'billingInfo', 'pricingData', 'draft',
  'noteTemplates', 'taskTemplates', 'contactTags', 'enabledModules',
  'musicPlayerVolume', 'musicPlayerShuffle', 'musicPlayerRepeat',
  'encryptedPasswords', 'encryptedFinancial', 'encryptedContacts',
  'encryptedChecklists', 'encryptedBudgets', 'encryptedPricingData',
  'encryptedStock', 'encryptedTechSheets', 'integrations',
] as const;

// ─── Loaded Data ─────────────────────────────────────────────────────────
export interface LoadedData {
  state: AppState;
  currentProject: string;
  theme: string;
}

// ─── Storage Service ─────────────────────────────────────────────────────
class StorageService {
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSyncs: Set<string> = new Set(); // Store names that need syncing
  private pendingSettings: Record<string, any> = {};
  private readonly DEBOUNCE_MS = 1000;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private currentPlan: string = 'free';

  private onRemoteUpdateCallback: (() => void) | null = null;

  constructor() {
    this.scheduleFlush = this.scheduleFlush.bind(this);
    this.processSyncQueue = this.processSyncQueue.bind(this);

    // Start background sync process (every 60 seconds for differential)
    this.processSyncQueue(); // Run immediately on start
    this.checkInterval = setInterval(() => this.processSyncQueue(), 60000);

    // Listen for updates from other tabs
    syncChannel.onmessage = (event) => {
      console.log('[StorageService] Broadcast received:', event.data.type);
      if (this.onRemoteUpdateCallback) {
        this.onRemoteUpdateCallback();
      }
    };
  }

  onRemoteUpdate(callback: () => void) {
    this.onRemoteUpdateCallback = callback;
  }

  setPlan(plan: string) {
    this.currentPlan = plan || 'free';
    console.log(`[StorageService] Active Plan: ${this.currentPlan.toUpperCase()}`);
  }

  private broadcast(type: string, data?: any) {
    syncChannel.postMessage({ type, data, sender: Date.now() });
  }

  // ── Load ────────────────────────────────────────────────────────────
  async loadAll(): Promise<LoadedData> {
    const migrated = await settingsStore.get<boolean>('dbMigrated');
    if (!migrated) {
      await this.migrateFromLocalStorage();
    }

    const entityResults = await Promise.all(
      ENTITY_MAP.map(async (m) => {
        try {
          const all = await db.getAll<any>(m.store);
          // Filter out tombstones (deleted items) for the active state
          return { store: m.store, data: all.filter(item => !item._is_deleted) };
        } catch {
          return { store: m.store, data: [] };
        }
      })
    );

    const entityData: Record<string, any[]> = {};
    for (const r of entityResults) {
      entityData[r.store] = r.data;
    }

    const allSettingsKeys = [
      ...SETTINGS_KEYS,
      'currentProject', 'theme',
      'lastRecurringCheck', 'lastFinancialRecurringCheck',
      'gamificationCore',
    ];
    const settings = await settingsStore.getMany(allSettingsKeys);

    const gamificationCore = (settings as any).gamificationCore || {};
    const gamificationStats = {
      pontos: gamificationCore.pontos ?? 0,
      nivel: gamificationCore.nivel ?? 1,
      historico: entityData.gamificationHistory || [],
      badges: gamificationCore.badges || [],
      focusDuration: gamificationCore.focusDuration ?? 25,
      shortBreakDuration: gamificationCore.shortBreakDuration ?? 5,
      longBreakDuration: gamificationCore.longBreakDuration ?? 15,
    };

    const wellnessStats = {
      breaks: entityData.wellnessBreaks || [],
    };

    const state: AppState = {
      projects: (settings as any).projects || [{ id: 'default', name: 'Projeto Padrão', color: '#dc3545' }],
      notes: entityData.notes || [],
      prompts: entityData.prompts || [],
      snippets: entityData.snippets || [],
      cheatsheet: entityData.cheatsheet || [],
      kanban: entityData.kanban || [],
      passwords: entityData.passwords || [],
      bookmarks: entityData.bookmarks || [],
      diary: entityData.diary || [],
      draft: (settings as any).draft ?? '',
      pomodoroStats: (settings as any).pomodoroStats || { focusSessions: 0, totalMinutes: 0 },
      wellnessStats,
      gamificationStats,
      noteTemplates: (settings as any).noteTemplates || [],
      taskTemplates: (settings as any).taskTemplates || [],
      financialAccounts: entityData.financialAccounts || [],
      financialCategories: entityData.financialCategories || [],
      financialBudgets: entityData.financialBudgets || [],
      financialTransactions: entityData.financialTransactions || [],
      contacts: entityData.contacts || [],
      contactTags: (settings as any).contactTags || [],
      checklists: entityData.checklists || [],
      musicPlayerVolume: (settings as any).musicPlayerVolume ?? 0.7,
      musicPlayerShuffle: (settings as any).musicPlayerShuffle ?? false,
      musicPlayerRepeat: (settings as any).musicPlayerRepeat ?? false,
      billingInfo: (settings as any).billingInfo || {
        companyName: '', address: '', taxId: '', logoUrl: '', email: '', phone: '',
      },
      serviceCatalog: entityData.serviceCatalog || [],
      budgets: entityData.budgets || [],
      pricingData: (settings as any).pricingData || {
        fixedCosts: 0, desiredSalary: 0, taxesPercent: 0,
        hoursPerDay: 8, daysPerMonth: 22, idealHourlyRate: 0,
      },
      stockMaterials: entityData.stockMaterials || [],
      techSheets: entityData.techSheets || [],
      enabledModules: ((settings as any).enabledModules && (settings as any).enabledModules.length > 0) ? (settings as any).enabledModules : [
        'dashboard', 'explorer', 'tutorial', 'wellness', 'musica', 'videos', 'favorites', 'notes',
        'prompts', 'snippets', 'cheatsheet', 'kanban', 'checklists',
        'passwords', 'contacts', 'orcamentos', 'precificador', 'estoque',
        'fichatecnica', 'finance', 'diary', 'draft', 'settings', 'profile', 'billing', 'integrations', 'analytics', 'wiki', 'assets', 'activity', 'planner', 'boards'
      ],
      notifications: entityData.notifications || [],
      integrations: (settings as any).integrations || [
        { id: 'github', provider: 'github', name: 'GitHub', description: 'Sincronize seus repositórios e gerencie issues diretamente do dashboard.', icon: 'Github', status: 'disconnected', category: 'dev', createdAt: new Date().toISOString() },
        { id: 'slack', provider: 'slack', name: 'Slack', description: 'Receba notificações e envie atualizações para seus canais de equipe.', icon: 'Slack', status: 'disconnected', category: 'comm', createdAt: new Date().toISOString() },
        { id: 'discord', provider: 'discord', name: 'Discord', description: 'Integração com webhooks e bots para monitoramento em tempo real.', icon: 'MessageSquare', status: 'disconnected', category: 'comm', createdAt: new Date().toISOString() },
        { id: 'gcalendar', provider: 'google', name: 'Google Calendar', description: 'Visualize seus compromissos e prazos integrados ao seu Kanban.', icon: 'Calendar', status: 'disconnected', category: 'productivity', createdAt: new Date().toISOString() },
        { id: 'openai', provider: 'openai', name: 'OpenAI (GPT-4)', description: 'Poder de IA para seus prompts, notas e geração automática de código.', icon: 'Zap', status: 'disconnected', category: 'ai', createdAt: new Date().toISOString() },
      ],
      wikiArticles: entityData.wikiArticles || [],
      assets: entityData.assets || [],
      activityLogs: entityData.activityLogs || [],
      boards: entityData.boards || [],
      boardElements: entityData.boardElements || [],
      boardConnections: entityData.boardConnections || [],
      encryptedPasswords: (settings as any).encryptedPasswords,
      encryptedFinancial: (settings as any).encryptedFinancial,
      encryptedContacts: (settings as any).encryptedContacts,
      encryptedChecklists: (settings as any).encryptedChecklists,
      encryptedBudgets: (settings as any).encryptedBudgets,
      encryptedPricingData: (settings as any).encryptedPricingData,
      encryptedStock: (settings as any).encryptedStock,
      encryptedTechSheets: (settings as any).encryptedTechSheets,
      goals: entityData.goals || [],
      habits: entityData.habits || [],
      habitLogs: entityData.habitLogs || [],
      plannerDays: entityData.plannerDays || [],
      wheelOfLife: entityData.wheelOfLife || [],
      moodPixels: entityData.moodPixels || [],
      dreamBoard: entityData.dreamBoard || [],
    };

    return {
      state,
      currentProject: (settings as any).currentProject || 'default',
      theme: (settings as any).theme || 'dark',
    };
  }

  // ── Diff & Persist ──────────────────────────────────────────────────
  async diffAndPersist(prev: AppState, next: AppState): Promise<void> {
    const timestamp = Date.now();

    for (const mapping of ENTITY_MAP) {
      const prevData = mapping.get(prev) || [];
      const nextData = mapping.get(next) || [];

      if (prevData === nextData) continue;

      const prevMap = new Map(prevData.map((i: any) => [i.id, i]));
      const nextMap = new Map(nextData.map((i: any) => [i.id, i]));

      const changes: Promise<void>[] = [];

      // Detect Added or Modified
      for (const item of nextData) {
        const prevItem = prevMap.get(item.id);
        
        // Remove internal-only fields before comparison to avoid infinite update loops
        const cleanPrev = prevItem ? { ...prevItem, _updated: undefined, _is_deleted: undefined, _v: undefined } : null;
        const cleanNext = { ...item, _updated: undefined, _is_deleted: undefined, _v: undefined };

        if (!prevItem || JSON.stringify(cleanPrev) !== JSON.stringify(cleanNext)) {
          // Optimized: Only write if truly different from what's in IndexedDB
          changes.push(db.put(mapping.store, { ...item, _updated: timestamp }));
        }
      }

      // Detect Deleted (Tombstones)
      for (const item of prevData) {
        if (!nextMap.has(item.id)) {
          changes.push(db.put(mapping.store, { ...item, _is_deleted: true, _updated: timestamp }));
        }
      }

      if (changes.length > 0) {
        await Promise.all(changes);
        this.pendingSyncs.add(mapping.store);
        this.scheduleFlush();
      }
    }

    // Settings logic remains similar but debounced
    const settingsChanges: Record<string, any> = {};
    for (const key of SETTINGS_KEYS) {
      if ((prev as any)[key] !== (next as any)[key]) {
        settingsChanges[key] = (next as any)[key];
      }
    }

    if (
      prev.gamificationStats.pontos !== next.gamificationStats.pontos ||
      prev.gamificationStats.nivel !== next.gamificationStats.nivel ||
      prev.gamificationStats.badges !== next.gamificationStats.badges ||
      prev.gamificationStats.focusDuration !== next.gamificationStats.focusDuration ||
      prev.gamificationStats.shortBreakDuration !== next.gamificationStats.shortBreakDuration ||
      prev.gamificationStats.longBreakDuration !== next.gamificationStats.longBreakDuration
    ) {
      settingsChanges.gamificationCore = {
        pontos: next.gamificationStats.pontos,
        nivel: next.gamificationStats.nivel,
        badges: next.gamificationStats.badges,
        focusDuration: next.gamificationStats.focusDuration,
        shortBreakDuration: next.gamificationStats.shortBreakDuration,
        longBreakDuration: next.gamificationStats.longBreakDuration,
      };
    }

    if (Object.keys(settingsChanges).length > 0) {
      this.queueSettingsWrite(settingsChanges);
    }
  }

  queueSettingsWrite(updates: Record<string, any>): void {
    Object.assign(this.pendingSettings, updates);
    this.scheduleFlush();

    const cloudSettings = [...SETTINGS_KEYS, 'theme', 'currentProject'];
    const filtered: any = {};
    for (const key of cloudSettings) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }
    if (Object.keys(filtered).length > 0) {
      this.syncSettingsToCloud(filtered);
    }
  }

  private async syncSettingsToCloud(settings: any) {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
    } catch (err) {
      console.warn('[StorageService] Settings sync failed:', err);
    }
  }

  async getSettings(keys: string[]): Promise<Record<string, any>> {
    return settingsStore.getMany(keys);
  }

  private scheduleFlush(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => this.flush(), this.DEBOUNCE_MS);
  }

  // ── Flush ───────────────────────────────────────────────────────────
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // 1. Flush Settings
    if (Object.keys(this.pendingSettings).length > 0) {
      await settingsStore.setMany({ ...this.pendingSettings });
      this.pendingSettings = {};
    }

    // 2. Differential Cloud Sync
    const token = localStorage.getItem('auth_token');
    if (token && this.pendingSyncs.size > 0) {
      const storesToSync = Array.from(this.pendingSyncs);
      this.pendingSyncs.clear();

      for (const store of storesToSync) {
        let modifiedItems: any[] = [];
        try {
          const syncKey = `lastSync_${store}`;
          const lastSync = await settingsStore.get<number>(syncKey) || 0;

          // Fetch only items modified since last sync (or all items if first sync ever)
          const allItems = await db.getAll<any>(store);
          modifiedItems = allItems.filter(item => (item._updated || 0) > lastSync || lastSync === 0);

          if (modifiedItems.length === 0) continue;

          console.log(`[StorageService] Syncing ${modifiedItems.length} items for ${store}...`);

          const res = await fetch(`/api/entities/${store}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items: modifiedItems })
          });

          if (res.ok) {
            const result = await res.json();
            await settingsStore.set(syncKey, Date.now());

            // Post-Sync Cleanup: Physically remove tombstones that are now on server
            const tombstones = modifiedItems.filter(i => i._is_deleted);
            for (const t of tombstones) {
              await db.delete(store, t.id);
            }

            if (result.conflicts?.length > 0) {
              console.warn(`[StorageService] Conflicts in ${store} handled.`, result.conflicts);
              for (const c of result.conflicts) {
                await db.put(store, { ...c.serverData, _v: c.serverVersion, _updated: Date.now() });
              }
              this.broadcast('local-update');
            }
          } else if (res.status >= 500) {
            console.warn(`[StorageService] Server error for ${store} (${res.status}). Queuing for retry.`);
            await this.saveToSyncQueue(store, modifiedItems);
          } else {
            console.error(`[StorageService] Unrecoverable error for ${store} (${res.status}). Batch dropped.`);
            // Update lastSync anyway for this store to prevent this specific failing set of items from hogging the sync
            // but log them as lost. In a real 'Elite' app, move them to a 'failedSync' store.
            await settingsStore.set(syncKey, Date.now());
          }
        } catch (err) {
          console.error(`[StorageService] Network error syncing ${store}. Queuing for retry.`, err);
          // Queueing network errors too ensures they aren't lost if the tab closes
          await this.saveToSyncQueue(store, modifiedItems);
        }
      }
    }

    this.broadcast('local-update');
  }

  // ── Sync Queue ─────────────────────────────────────────────────────
  private async saveToSyncQueue(store: string, items: any[]): Promise<void> {
    const queueItem = {
      id: `${store}-${Date.now()}`,
      store,
      items,
      timestamp: Date.now(),
      attempts: 0
    };
    await db.put('syncQueue', queueItem);
  }

  async processSyncQueue(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    // Removed naive 'pro' check that blocks 'elite'/'enterprise' plans or development tests
    if (!token) return;

    try {
      const queue = await db.getAll<any>('syncQueue');
      if (queue.length === 0) return;

      for (const item of queue) {
        try {
          const res = await fetch(`/api/entities/${item.store}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items: item.items })
          });

          if (res.ok) {
            await db.delete('syncQueue', item.id);
            // Cleanup tombstones if any
            for (const i of item.items) {
              if (i._is_deleted) await db.delete(item.store, i.id);
            }
          } else if (res.status >= 500) {
            item.attempts = (item.attempts || 0) + 1;
            if (item.attempts > 10) await db.delete('syncQueue', item.id);
            else await db.put('syncQueue', item);
          } else {
            // Drop client-error items (4xx: unauthorized, invalid schema, etc)
            console.error(`[StorageService Queue] Dropping item due to terminal error ${res.status}`);
            await db.delete('syncQueue', item.id);
          }
        } catch (e) { 
          console.error(`[StorageService Queue] Fatal error during sync for ${item.store}:`, e);
          continue; // Don't block the entire queue if one store has a fetch error
        }
      }
    } catch (err) { console.error('[StorageService] Queue error:', err); }
  }

  // ── Cloud Fetch ────────────────────────────────────────────────────
  /** Fetch all data from cloud and merge into local DB */
  async syncFromCloud(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      console.log('[StorageService] Syncing from cloud...');

      // 1. Sync Settings
      const setRes = await fetch(`/api/settings?_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (setRes.ok) {
        const settings = await setRes.json();
        if (Object.keys(settings).length > 0) {
          await settingsStore.setMany(settings);
          // Trigger theme application if needed (simplified here, AppContext handles it normally on next load)
        }
      }

      // 2. Sync Entities
      const results = await Promise.all(
        ENTITY_MAP.map(async (m) => {
          const res = await fetch(`/api/entities/${m.store}?_t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) return { store: m.store, items: await res.json() };
          return { store: m.store, items: [] };
        })
      );

      const dbPromises = results.map(r => {
        if (r.items.length > 0) {
          // Map cloud items back to local format with versioning
          const localItems = r.items.map((i: any) => ({
            ...i,
            _v: i._serverV,
            projectId: i._projectId || i.projectId
          }));
          return db.replaceAll(r.store, localItems);
        }
        return Promise.resolve();
      });

      await Promise.all(dbPromises);
      console.log('[StorageService] Cloud sync complete.');
      if (this.onRemoteUpdateCallback) {
        this.onRemoteUpdateCallback();
      }
    } catch (err) {
      console.error('[StorageService] Cloud fetch failed:', err);
    }
  }

  // ── Import ──────────────────────────────────────────────────────────
  /** Import full AppState from an external source (backup restore) */
  async importAll(appState: AppState, extras?: { theme?: string; currentProject?: string }): Promise<void> {
    // Clear all IDB stores
    await db.clearAll();

    // Write entity data to IDB
    const entityPromises: Promise<void>[] = [];
    for (const mapping of ENTITY_MAP) {
      const items = mapping.get(appState);
      if (items && items.length > 0) {
        entityPromises.push(db.replaceAll(mapping.store, items));
      }
    }
    await Promise.all(entityPromises);

    // Write settings
    const settingsData: Record<string, any> = {
      dbMigrated: true,
    };

    for (const key of SETTINGS_KEYS) {
      if ((appState as any)[key] !== undefined) {
        settingsData[key] = (appState as any)[key];
      }
    }

    // Gamification core
    settingsData.gamificationCore = {
      pontos: appState.gamificationStats.pontos,
      nivel: appState.gamificationStats.nivel,
      badges: appState.gamificationStats.badges,
      focusDuration: appState.gamificationStats.focusDuration,
      shortBreakDuration: appState.gamificationStats.shortBreakDuration,
      longBreakDuration: appState.gamificationStats.longBreakDuration,
    };

    // Extra settings
    if (extras?.theme) settingsData.theme = extras.theme;
    if (extras?.currentProject) settingsData.currentProject = extras.currentProject;

    await settingsStore.setMany(settingsData);
  }

  // ── Migration ───────────────────────────────────────────────────────
  /** One-time migration from old localStorage JSON blob */
  private async migrateFromLocalStorage(): Promise<void> {
    const raw = localStorage.getItem('devCommandCenter');
    if (!raw) {
      await settingsStore.set('dbMigrated', true);
      return;
    }

    try {
      const data = JSON.parse(raw);

      // Write entity data to IDB
      const entityWrites: Promise<void>[] = [];
      const entityFieldMap: Record<string, string> = {
        notes: 'notes',
        prompts: 'prompts',
        snippets: 'snippets',
        cheatsheet: 'cheatsheet',
        kanban: 'kanban',
        passwords: 'passwords',
        bookmarks: 'bookmarks',
        diary: 'diary',
        contacts: 'contacts',
        checklists: 'checklists',
        financialAccounts: 'financialAccounts',
        financialCategories: 'financialCategories',
        financialBudgets: 'financialBudgets',
        financialTransactions: 'financialTransactions',
        budgets: 'budgets',
        serviceCatalog: 'serviceCatalog',
        stockMaterials: 'stockMaterials',
        techSheets: 'techSheets',
        goals: 'goals',
        habits: 'habits',
        habitLogs: 'habitLogs',
      };

      for (const [store, field] of Object.entries(entityFieldMap)) {
        const items = data[field];
        if (Array.isArray(items) && items.length > 0) {
          entityWrites.push(db.replaceAll(store, items));
        }
      }

      // Special nested fields
      if (data.wellnessStats?.breaks?.length > 0) {
        entityWrites.push(db.replaceAll('wellnessBreaks', data.wellnessStats.breaks));
      }
      if (data.gamificationStats?.historico?.length > 0) {
        entityWrites.push(db.replaceAll('gamificationHistory', data.gamificationStats.historico));
      }

      await Promise.all(entityWrites);

      // Write settings
      const settingsData: Record<string, any> = {
        dbMigrated: true,
      };

      // Simple settings
      for (const key of SETTINGS_KEYS) {
        if (data[key] !== undefined) {
          settingsData[key] = data[key];
        }
      }

      // Gamification core (without historico)
      if (data.gamificationStats) {
        settingsData.gamificationCore = {
          pontos: data.gamificationStats.pontos ?? 0,
          nivel: data.gamificationStats.nivel ?? 1,
          badges: data.gamificationStats.badges || [],
          focusDuration: data.gamificationStats.focusDuration ?? 25,
          shortBreakDuration: data.gamificationStats.shortBreakDuration ?? 5,
          longBreakDuration: data.gamificationStats.longBreakDuration ?? 15,
        };
      }

      // Migrate theme, currentProject from separate localStorage keys
      const theme = localStorage.getItem('theme');
      if (theme) settingsData.theme = theme;

      const currentProject = localStorage.getItem('currentProject');
      if (currentProject) settingsData.currentProject = currentProject;

      const lastRecurringCheck = localStorage.getItem('lastRecurringCheck');
      if (lastRecurringCheck) settingsData.lastRecurringCheck = lastRecurringCheck;

      const lastFinancialCheck = localStorage.getItem('lastFinancialRecurringCheck');
      if (lastFinancialCheck) settingsData.lastFinancialRecurringCheck = lastFinancialCheck;

      await settingsStore.setMany(settingsData);

      console.log('[StorageService] Migration from localStorage complete.');
    } catch (err) {
      console.error('[StorageService] Migration failed:', err);
      // Mark as migrated to avoid retry loops; old data remains in localStorage as backup
      await settingsStore.set('dbMigrated', true);
    }
  }
}

// Singleton
export const storageService = new StorageService();
