const DB_NAME = 'lumia-media';
const STORE_NAME = 'media';
const DB_VERSION = 1;

// Max total storage: 500MB
const MAX_STORAGE_BYTES = 500 * 1024 * 1024;

export interface StoredMediaItem {
  id: string;
  blob: Blob;
  type: 'image' | 'video';
  timestamp: number;
}

export interface MediaMetadata {
  id: string;
  type: 'image' | 'video';
  timestamp: number;
  size: number;
}

let db: IDBDatabase | null = null;
let useMemoryFallback = false;
const memoryStore = new Map<string, StoredMediaItem>();

const checkIndexedDBSupport = (): boolean => {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
};

const openDB = (): Promise<IDBDatabase> => {
  if (useMemoryFallback) return Promise.reject(new Error('Using memory fallback'));
  if (db) return Promise.resolve(db);
  
  if (!checkIndexedDBSupport()) {
    useMemoryFallback = true;
    console.warn('[MediaStorage] IndexedDB unavailable, using in-memory storage');
    return Promise.reject(new Error('IndexedDB not supported'));
  }
  
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        useMemoryFallback = true;
        console.warn('[MediaStorage] IndexedDB error, falling back to memory');
        reject(request.error);
      };
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      request.onupgradeneeded = (e) => {
        const database = (e.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    } catch (e) {
      useMemoryFallback = true;
      console.warn('[MediaStorage] IndexedDB exception, falling back to memory');
      reject(e);
    }
  });
};

// Memory fallback helpers
const getMemorySize = (): number => {
  let total = 0;
  memoryStore.forEach(item => { total += item.blob.size; });
  return total;
};

const enforceMemoryLimit = (newSize: number): void => {
  const totalSize = getMemorySize() + newSize;
  if (totalSize <= MAX_STORAGE_BYTES) return;
  
  const sorted = Array.from(memoryStore.values()).sort((a, b) => a.timestamp - b.timestamp);
  let freed = 0;
  for (const old of sorted) {
    if (totalSize - freed <= MAX_STORAGE_BYTES) break;
    memoryStore.delete(old.id);
    freed += old.blob.size;
  }
};

export const saveMedia = async (item: StoredMediaItem): Promise<void> => {
  try {
    const database = await openDB();
    
    const meta = await loadMediaMetadata();
    const totalSize = meta.reduce((sum, m) => sum + m.size, 0) + item.blob.size;
    
    if (totalSize > MAX_STORAGE_BYTES) {
      const sorted = meta.sort((a, b) => a.timestamp - b.timestamp);
      let freed = 0;
      for (const old of sorted) {
        if (totalSize - freed <= MAX_STORAGE_BYTES) break;
        await deleteMediaItem(old.id);
        freed += old.size;
      }
    }
    
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Memory fallback
    enforceMemoryLimit(item.blob.size);
    memoryStore.set(item.id, item);
  }
};

export const loadMediaMetadata = async (): Promise<MediaMetadata[]> => {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const items = (request.result || []) as StoredMediaItem[];
        resolve(items.map(i => ({ id: i.id, type: i.type, timestamp: i.timestamp, size: i.blob.size })));
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Memory fallback
    return Array.from(memoryStore.values()).map(i => ({
      id: i.id, type: i.type, timestamp: i.timestamp, size: i.blob.size
    }));
  }
};

export const loadMediaBlob = async (id: string): Promise<Blob | null> => {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return memoryStore.get(id)?.blob || null;
  }
};

export const loadAllMedia = async (): Promise<StoredMediaItem[]> => {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return Array.from(memoryStore.values());
  }
};

export const deleteMediaItem = async (id: string): Promise<void> => {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    memoryStore.delete(id);
  }
};

export const clearAllMedia = async (): Promise<void> => {
  try {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    memoryStore.clear();
  }
};

export const isUsingMemoryFallback = (): boolean => useMemoryFallback;
