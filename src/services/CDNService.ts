interface CDNConfig {
  primary: string;
  fallbacks: string[];
  timeout: number;
  retryAttempts: number;
}

interface CacheEntry {
  data: ArrayBuffer;
  timestamp: number;
  url: string;
}

class CDNService {
  private static instance: CDNService;
  private cache = new Map<string, CacheEntry>();
  private config: CDNConfig;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.config = {
      primary: 'https://cdn.lumia-pro.app',
      fallbacks: [
        'https://backup-cdn.lumia-pro.app',
        '/public' // Local fallback
      ],
      timeout: 10000,
      retryAttempts: 3
    };
  }

  static getInstance(): CDNService {
    if (!this.instance) {
      this.instance = new CDNService();
    }
    return this.instance;
  }

  async loadLUT(filename: string): Promise<ArrayBuffer> {
    const cacheKey = `lut:${filename}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    // Try loading from CDN with fallbacks
    const urls = [
      `${this.config.primary}/luts/${filename}`,
      ...this.config.fallbacks.map(fallback => `${fallback}/luts/${filename}`)
    ];

    for (const url of urls) {
      try {
        const data = await this.fetchWithTimeout(url, this.config.timeout);
        
        // Cache successful result
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          url
        });
        
        return data;
      } catch (error) {
        console.warn(`Failed to load LUT from ${url}:`, error);
        continue;
      }
    }

    throw new Error(`Failed to load LUT ${filename} from all sources`);
  }

  async preloadLUTs(filenames: string[]): Promise<void> {
    const loadPromises = filenames.map(async (filename) => {
      try {
        await this.loadLUT(filename);
      } catch (error) {
        console.warn(`Failed to preload LUT ${filename}:`, error);
      }
    });

    await Promise.allSettled(loadPromises);
  }

  private async fetchWithTimeout(url: string, timeout: number): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'force-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getCacheStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.data.byteLength, 0);
    
    return {
      entries: entries.length,
      totalSize,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp))
    };
  }

  clearCache() {
    this.cache.clear();
  }

  updateConfig(newConfig: Partial<CDNConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

export const cdnService = CDNService.getInstance();
