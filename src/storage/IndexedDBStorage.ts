import type { ExperimentSession } from '../research/recording/types.js';

const DB_NAME = 'AuditoryGraphExplorerDB';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';

export interface StorageResult {
  readonly isPersistent: boolean;
  readonly error?: Error;
}

export class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: Map<string, ExperimentSession> = new Map();
  private writeQueue: Promise<unknown> = Promise.resolve();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB is not supported in this environment; falling back to memory store.'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
            db.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' });
          }
        };

        request.onsuccess = () => resolve(request.result);

        request.onblocked = () => {
          console.warn('IndexedDB database open request blocked by another open tab/connection.');
        };

        request.onerror = () => {
          this.dbPromise = null; // Do not cache failed connection attempts
          const err = request.error ?? new Error('Failed to open IndexedDB database.');
          reject(err);
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });

    return this.dbPromise;
  }

  /**
   * Saves a session. Always updates in-memory copy immediately, and commits
   * to durable IndexedDB storage in strict FIFO order via writeQueue.
   * Resolves only upon transaction completion.
   */
  public async saveSession(session: ExperimentSession): Promise<StorageResult> {
    this.memoryFallback.set(session.sessionId, session);

    const performWrite = async (): Promise<StorageResult> => {
      try {
        const db = await this.getDB();
        return await new Promise<StorageResult>((resolve) => {
          try {
            const tx = db.transaction(SESSIONS_STORE, 'readwrite');
            const store = tx.objectStore(SESSIONS_STORE);
            store.put(session);

            tx.oncomplete = () => {
              resolve({ isPersistent: true });
            };

            tx.onerror = () => {
              const err = tx.error ?? new Error('IndexedDB transaction failed.');
              resolve({ isPersistent: false, error: err });
            };

            tx.onabort = () => {
              const err = tx.error ?? new Error('IndexedDB transaction aborted.');
              resolve({ isPersistent: false, error: err });
            };
          } catch (txErr: unknown) {
            const err = txErr instanceof Error ? txErr : new Error(String(txErr));
            resolve({ isPersistent: false, error: err });
          }
        });
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        return { isPersistent: false, error };
      }
    };

    // Serialize all writes sequentially to avoid older snapshots overwriting newer ones
    const nextPromise = this.writeQueue.then(performWrite, performWrite);
    this.writeQueue = nextPromise;
    return nextPromise;
  }

  public async getSession(sessionId: string): Promise<ExperimentSession | null> {
    await this.writeQueue;
    try {
      const db = await this.getDB();
      return await new Promise<ExperimentSession | null>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.get(sessionId);
        req.onsuccess = () => resolve((req.result as ExperimentSession) ?? this.memoryFallback.get(sessionId) ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.get(sessionId) ?? null;
    }
  }

  public async getAllSessions(): Promise<ExperimentSession[]> {
    await this.writeQueue;
    try {
      const db = await this.getDB();
      return await new Promise<ExperimentSession[]>((resolve, reject) => {
        const tx = db.transaction(SESSIONS_STORE, 'readonly');
        const store = tx.objectStore(SESSIONS_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as ExperimentSession[]) ?? [];
          if (list.length === 0 && this.memoryFallback.size > 0) {
            resolve(Array.from(this.memoryFallback.values()));
          } else {
            resolve(list);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(this.memoryFallback.values());
    }
  }

  public async deleteSession(sessionId: string): Promise<StorageResult> {
    this.memoryFallback.delete(sessionId);
    try {
      const db = await this.getDB();
      return await new Promise<StorageResult>((resolve) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        store.delete(sessionId);
        tx.oncomplete = () => resolve({ isPersistent: true });
        tx.onerror = () => resolve({ isPersistent: false, error: tx.error ?? new Error('Delete transaction failed.') });
        tx.onabort = () => resolve({ isPersistent: false, error: tx.error ?? new Error('Delete transaction aborted.') });
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { isPersistent: false, error };
    }
  }

  public async clearAll(): Promise<StorageResult> {
    this.memoryFallback.clear();
    try {
      const db = await this.getDB();
      return await new Promise<StorageResult>((resolve) => {
        const tx = db.transaction(SESSIONS_STORE, 'readwrite');
        const store = tx.objectStore(SESSIONS_STORE);
        store.clear();
        tx.oncomplete = () => resolve({ isPersistent: true });
        tx.onerror = () => resolve({ isPersistent: false, error: tx.error ?? new Error('Clear transaction failed.') });
        tx.onabort = () => resolve({ isPersistent: false, error: tx.error ?? new Error('Clear transaction aborted.') });
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      return { isPersistent: false, error };
    }
  }
}
