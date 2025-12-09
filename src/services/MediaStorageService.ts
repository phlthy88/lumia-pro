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

const openDB = (): Promise<IDBDatabase> => {
  if (db) return Promise.resolve(db);
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
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
  });
};

export const saveMedia = async (item: StoredMediaItem): Promise<void> => {
  const database = await openDB();
  
  // Enforce storage limit - delete oldest if over limit
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
};

// Load only metadata (no blobs) - for initial listing
export const loadMediaMetadata = async (): Promise<MediaMetadata[]> => {
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
};

// Load single item's blob on demand
export const loadMediaBlob = async (id: string): Promise<Blob | null> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result?.blob || null);
    request.onerror = () => reject(request.error);
  });
};

export const loadAllMedia = async (): Promise<StoredMediaItem[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const deleteMediaItem = async (id: string): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const clearAllMedia = async (): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
