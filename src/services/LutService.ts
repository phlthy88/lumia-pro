import { LutData } from '../types';

// LRU Cache for loaded LUTs
const LUT_CACHE_MAX = 5;
const lutCache = new Map<string, LutData>();
const lutAccessOrder: string[] = [];

export class LutService {
  
  // Generate a neutral Identity LUT (Base)
  static generateIdentity(size = 33): LutData {
    const data = new Float32Array(size * size * size * 3);
    const scale = size > 1 ? size - 1 : 1;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          const index = (i * size * size + j * size + k) * 3;
          data[index] = k / scale;
          data[index + 1] = j / scale;
          data[index + 2] = i / scale;
        }
      }
    }
    return { name: "Standard (Rec.709)", size, data };
  }

  // Generate a "Teal & Orange" LUT mathematically
  static generateTealOrange(size = 33): LutData {
    const data = new Float32Array(size * size * size * 3);
    const scale = size > 1 ? size - 1 : 1;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          const index = (i * size * size + j * size + k) * 3;
          let r = k / scale;
          let g = j / scale;
          let b = i / scale;
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          r = Math.min(1.0, r + (luma * 0.1) + (0.05 * (1.0 - luma)));
          b = Math.max(0.0, b + ((1.0 - luma) * 0.1) - (luma * 0.05));
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
        }
      }
    }
    return { name: "Blockbuster (Teal/Orange)", size, data };
  }

  // Parse an uploaded .cube file
  static parseCube(content: string, name: string): LutData {
    const lines = content.split('\n');
    let size = 33;
    let dataIndex = 0;
    let data: Float32Array | null = null;

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('LUT_3D_SIZE')) {
        size = parseInt(line.split(' ')[1] ?? '33');
        data = new Float32Array(size * size * size * 3);
        break;
      }
    }

    if (!data) {
      throw new Error(`LUT_3D_SIZE not found in ${name}`);
    }

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('#') || line.startsWith('TITLE') || line.startsWith('LUT') || line === '') continue;
      const parts = line.split(/\s+/).filter(s => s !== '').map(parseFloat);
      if (parts.length === 3 && data) {
        if (dataIndex < data.length) {
          data[dataIndex++] = parts[0]!;
          data[dataIndex++] = parts[1]!;
          data[dataIndex++] = parts[2]!;
        }
      }
    }

    return { name, size, data };
  }

  static async loadFromUrl(url: string, name: string): Promise<LutData> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    const text = await response.text();
    return this.parseCube(text, name);
  }

  // Load LUT with LRU caching
  static async loadCached(url: string, name: string): Promise<LutData> {
    if (lutCache.has(url)) {
      // Move to end of access order (most recently used)
      const idx = lutAccessOrder.indexOf(url);
      if (idx > -1) lutAccessOrder.splice(idx, 1);
      lutAccessOrder.push(url);
      return lutCache.get(url)!;
    }

    const lut = await this.loadFromUrl(url, name);

    // Evict oldest if at capacity
    if (lutCache.size >= LUT_CACHE_MAX) {
      const oldest = lutAccessOrder.shift();
      if (oldest) {
        lutCache.delete(oldest);
        console.log(`[LutService] Evicted ${oldest} from cache`);
      }
    }

    lutCache.set(url, lut);
    lutAccessOrder.push(url);
    console.log(`[LutService] Cached ${name} (${lutCache.size}/${LUT_CACHE_MAX})`);
    return lut;
  }

  static clearCache(): void {
    lutCache.clear();
    lutAccessOrder.length = 0;
    console.log('[LutService] Cache cleared');
  }

  static getCacheSize(): number {
    return lutCache.size;
  }
}
