import type { ExperimentSession } from '../research/recording/types.js';

const DB_NAME = 'AuditoryGraphExplorerDB';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';

export class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: Map<string, ExperimentSession> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB not supported, using in-memory store.'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          db.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public async saveSession(session: ExperimentSession): Promise<void> {
    this.memoryFallback.set(session.sessionId, session);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.put(session);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // In-memory fallback used
    }
  }

  public async getSession(sessionId: string): Promise<ExperimentSession | null> {
    try {
      const db = await this.getDB();
      return await new Promise<ExperimentSession | null>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.get(sessionId);
        req.onsuccess = () => resolve((req.result as ExperimentSession) ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.get(sessionId) ?? null;
    }
  }

  public async getAllSessions(): Promise<ExperimentSession[]> {
    try {
      const db = await this.getDB();
      return await new Promise<ExperimentSession[]>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as ExperimentSession[]) ?? []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(this.memoryFallback.values());
    }
  }

  public async deleteSession(sessionId: string): Promise<void> {
    this.memoryFallback.delete(sessionId);
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.delete(sessionId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // deleted from memory
    }
  }

  public async clearAll(): Promise<void> {
    this.memoryFallback.clear();
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // cleared
    }
  }
}
