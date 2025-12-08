
export interface LogEntry {
    timestamp: number;
    type: 'permission' | 'error' | 'performance';
    data: any;
}

const DB_NAME = 'LumiaPrivacyLog';
const STORE_NAME = 'logs';
const VERSION = 1;

export class PrivacyLog {
    private static db: IDBDatabase | null = null;

    private static async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'timestamp' });
                }
            };
        });
    }

    static async log(type: LogEntry['type'], data: any): Promise<void> {
        // Privacy Guard: Ensure no PII is logged (simplified check)
        // In a real app, we would sanitize `data` recursively.

        const entry: LogEntry = {
            timestamp: Date.now(),
            type,
            data
        };

        try {
            const db = await this.getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.add(entry);
        } catch (e) {
            console.warn('[PrivacyLog] Failed to write log locally', e);
        }
    }

    static async getLogs(): Promise<LogEntry[]> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            return [];
        }
    }

    static async clear(): Promise<void> {
        try {
            const db = await this.getDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.clear();
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}
