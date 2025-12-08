import { LutData } from '../types';

export class LutService {
  
  // Generate a neutral Identity LUT (Base)
  static generateIdentity(size = 33): LutData {
    const data = new Float32Array(size * size * size * 3);
    const scale = size > 1 ? size - 1 : 1; // Prevent division by zero
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          const index = (i * size * size + j * size + k) * 3;
          data[index] = k / scale;     // R
          data[index + 1] = j / scale; // G
          data[index + 2] = i / scale; // B
        }
      }
    }
    return { name: "Standard (Rec.709)", size, data };
  }

  // Generate a "Teal & Orange" LUT mathematically
  static generateTealOrange(size = 33): LutData {
    const data = new Float32Array(size * size * size * 3);
    const scale = size > 1 ? size - 1 : 1; // Prevent division by zero
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          const index = (i * size * size + j * size + k) * 3;
          
          // Normalised RGB
          let r = k / scale;
          let g = j / scale;
          let b = i / scale;

          // Push Shadows to Teal, Highlights to Orange
          const luma = r * 0.299 + g * 0.587 + b * 0.114;
          
          r = Math.min(1.0, r + (luma * 0.1) + (0.05 * (1.0 - luma))); // Warm highlights
          b = Math.max(0.0, b + ((1.0 - luma) * 0.1) - (luma * 0.05)); // Cool shadows
          
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
    let size = 33; // Default
    let dataIndex = 0;
    let data: Float32Array | null = null;

    // First pass: Find size
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

    // Second pass: Read Data
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('#') || line.startsWith('TITLE') || line.startsWith('LUT') || line === '') continue;

      // Handle potentially multiple values on one line or spaces
      const parts = line.split(/\s+/).filter(s => s !== '').map(parseFloat);
      
      // Standard CUBE has 3 floats per line
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
}
