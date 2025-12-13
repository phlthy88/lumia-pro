import { openDB, IDBPDatabase } from 'idb'; // Uses IndexedDB
// This file uses IndexedDB for storage via the 'idb' library.

/**
 * @fileoverview Service for storing and managing media (photos and videos)
 * using IndexedDB, with eviction policies for size and item count.
 */

export interface MediaItemMetadata {
  id: string;
  type: 'image' | 'video';
  timestamp: number;
  size: number;
  duration?: number;
  mimeType: string;
}

// Internal interface for IndexedDB storage
interface StoredMediaItem {
  id: string;
  blob: Blob;
  metadata: Omit<MediaItemMetadata, 'id'>;
}

export interface IMediaStorage {
  listMetadata(): Promise<MediaItemMetadata[]>;
  getBlob(id: string): Promise<Blob | null>;
  saveBlob(id: string, blob: Blob, metadata: Omit<MediaItemMetadata, 'id'>): Promise<void>;
  deleteBlob(id: string): Promise<void>;
  getTotalSize(): Promise<number>;
  clear(): Promise<void>;
}

const DB_NAME = 'lumia-media-library';
const STORE_NAME = 'media';
const DEFAULT_MAX_ITEMS = 100;
const DEFAULT_MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

export class IndexedDBMediaStorage implements IMediaStorage {
  private db: IDBPDatabase | null = null;
  private maxItems: number;
  private maxTotalSize: number;

  constructor(dbName: string = DB_NAME, maxItems: number = DEFAULT_MAX_ITEMS, maxTotalSize: number = DEFAULT_MAX_TOTAL_SIZE) {
    this.maxItems = maxItems;
    this.maxTotalSize = maxTotalSize;
    this.init(dbName);
  }

  private async init(dbName: string): Promise<void> {
    try {
      this.db = await openDB(dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        },
      });
    } catch (error) {
      console.error('[IndexedDBMediaStorage] Failed to open IndexedDB:', error);
      // Fallback or error handling if IndexedDB is not available or fails
    }
  }

  private async getDb(): Promise<IDBPDatabase> {
    if (!this.db) {
      // Attempt to re-initialize if not already
      await this.init(DB_NAME);
      if (!this.db) {
        throw new Error('IndexedDB is not available or failed to initialize.');
      }
    }
    return this.db;
  }

  async listMetadata(): Promise<MediaItemMetadata[]> {
    try {
      const db = await this.getDb();
      const allItems = await db.getAll(STORE_NAME);
      return allItems.map((item: StoredMediaItem) => ({
        id: item.id,
        type: item.metadata.type,
        timestamp: item.metadata.timestamp,
        size: item.blob.size,
        duration: item.metadata.duration,
        mimeType: item.metadata.mimeType,
      }));
    } catch (error) {
      console.error('[IndexedDBMediaStorage] Error listing metadata:', error);
      return [];
    }
  }

  async getBlob(id: string): Promise<Blob | null> {
    try {
      const db = await this.getDb();
      const item: StoredMediaItem | undefined = await db.get(STORE_NAME, id);
      return item?.blob || null;
    } catch (error) {
      console.error(`[IndexedDBMediaStorage] Error getting blob for ${id}:`, error);
      return null;
    }
  }

  async saveBlob(id: string, blob: Blob, metadata: Omit<MediaItemMetadata, 'id'>): Promise<void> {
    try {
      const db = await this.getDb();
      const storedItem: StoredMediaItem = { id, blob, metadata };

      await this.enforceEvictionPolicy(blob.size);

      await db.put(STORE_NAME, storedItem);
    } catch (error) {
      console.error(`[IndexedDBMediaStorage] Error saving blob ${id}:`, error);
      throw error;
    }
  }

  async deleteBlob(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(STORE_NAME, id);
    } catch (error) {
      console.error(`[IndexedDBMediaStorage] Error deleting blob ${id}:`, error);
    }
  }

  async getTotalSize(): Promise<number> {
    try {
      const db = await this.getDb();
      const allItems = await db.getAll(STORE_NAME);
      return allItems.reduce((sum: number, item: StoredMediaItem) => sum + item.blob.size, 0);
    } catch (error) {
      console.error('[IndexedDBMediaStorage] Error getting total size:', error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDb();
      await db.clear(STORE_NAME);
    } catch (error) {
      console.error('[IndexedDBMediaStorage] Error clearing storage:', error);
    }
  }

  private async enforceEvictionPolicy(newBlobSize: number): Promise<void> {
    const db = await this.getDb();
    let currentMetadata = await this.listMetadata();
    
    // Sort by timestamp (oldest first)
    currentMetadata.sort((a, b) => a.timestamp - b.timestamp);

    // Enforce maxItems
    while (currentMetadata.length >= this.maxItems) {
      const oldest = currentMetadata.shift();
      if (oldest) {
        await db.delete(STORE_NAME, oldest.id);
      }
    }

    // Enforce maxTotalSize
    let currentTotalSize = await this.getTotalSize();
    while (currentTotalSize + newBlobSize > this.maxTotalSize) {
      const oldest = currentMetadata.shift();
      if (oldest) {
        await db.delete(STORE_NAME, oldest.id);
        currentTotalSize -= oldest.size; // Subtract size of evicted item
      } else {
        // No more items to evict, but still over size limit (shouldn't happen with proper logic)
        // Or the new item itself is larger than maxTotalSize
        console.warn('[IndexedDBMediaStorage] Cannot enforce maxTotalSize, storage full.');
        break; 
      }
    }
  }
}

export const mediaStorage: IMediaStorage = new IndexedDBMediaStorage();