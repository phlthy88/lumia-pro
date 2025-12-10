/**
 * Scene Director Service - External AI Vision Analysis
 * 
 * Uses Vision-Language Models (Gemini, OpenAI, Anthropic) to analyze
 * webcam frames and suggest color grading adjustments.
 * 
 * This is a "slow" AI that runs on-demand (not real-time) to provide
 * intelligent scene understanding that MediaPipe cannot do.
 */

import { ColorGradeParams } from '../types';

export type AIProvider = 'openrouter';

export interface SceneAnalysis {
  provider: AIProvider;
  lighting: 'low' | 'balanced' | 'harsh' | 'backlit';
  colorTemperature: 'warm' | 'neutral' | 'cool';
  mood: string;
  suggestedAdjustments: Partial<ColorGradeParams>;
  suggestedLut: string | null;
  compositionFeedback: string;
  confidence: number;
}

export interface APIKeys {
  openrouter?: string;
  openrouterModel?: string;
}

const ANALYSIS_PROMPT = `Analyze this webcam frame for professional video/streaming.
Return ONLY valid JSON (no markdown, no code blocks). Format:
{
  "lighting": "low" | "balanced" | "harsh" | "backlit",
  "colorTemperature": "warm" | "neutral" | "cool",
  "mood": "string describing the scene mood",
  "suggestedAdjustments": {
    "exposure": number (-1 to 1, 0 is neutral),
    "temperature": number (-1 to 1, negative=cool/blue, positive=warm/orange),
    "tint": number (-1 to 1, negative=green, positive=magenta),
    "contrast": number (-0.5 to 0.5),
    "saturation": number (-0.5 to 0.5)
  },
  "suggestedLut": "name of cinematic look or null",
  "compositionFeedback": "brief advice on framing/positioning",
  "confidence": number (0-1)
}`;

class SceneDirectorService {
  private keys: APIKeys = {};
  private captureWorker: Worker | null = null;
  private captureRequests = new Map<number, { resolve: (dataUrl: string) => void; reject: (err: Error) => void }>();
  private captureRequestId = 0;

  configure(keys: APIKeys): void {
    this.keys = { ...this.keys, ...keys };
  }

  getConfiguredProviders(): AIProvider[] {
    return this.keys.openrouter ? ['openrouter'] : [];
  }

  hasAnyProvider(): boolean {
    return this.getConfiguredProviders().length > 0;
  }

  private ensureCaptureWorker() {
    if (this.captureWorker) return;

    this.captureWorker = new Worker(new URL('../workers/FrameCaptureWorker.ts', import.meta.url), { type: 'module' });

    this.captureWorker.onmessage = (event: MessageEvent<{ type: string; id: number; dataUrl?: string; message?: string }>) => {
      const { type, id, dataUrl, message } = event.data;
      const pending = this.captureRequests.get(id);
      if (!pending) return;

      this.captureRequests.delete(id);

      if (type === 'capture-result' && dataUrl) {
        pending.resolve(dataUrl);
      } else {
        pending.reject(new Error(message ?? 'Frame capture failed'));
      }
    };

    this.captureWorker.onerror = (err) => {
      console.error('[SceneDirector] Capture worker error:', err);
      this.captureRequests.forEach(({ reject }) => reject(err instanceof Error ? err : new Error('Capture worker failed')));
      this.captureRequests.clear();
      this.captureWorker?.terminate();
      this.captureWorker = null;
    };
  }

  private async captureFrame(video: HTMLVideoElement, quality = 0.6): Promise<string> {
    // Use a worker to offload encoding and reduce jank
    this.ensureCaptureWorker();
    if (!this.captureWorker) {
      throw new Error('Capture worker unavailable');
    }

    const sourceWidth = video.videoWidth || 0;
    const sourceHeight = video.videoHeight || 0;
    if (!sourceWidth || !sourceHeight) throw new Error('Video dimensions unavailable');

    const maxWidth = 640;
    const maxHeight = 360;
    const scale = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const bitmap = await createImageBitmap(video, {
      resizeWidth: targetWidth,
      resizeHeight: targetHeight,
      resizeQuality: 'high'
    });

    const requestId = ++this.captureRequestId;

    return new Promise((resolve, reject) => {
      this.captureRequests.set(requestId, { resolve, reject });

      try {
        this.captureWorker!.postMessage(
          { type: 'capture', id: requestId, image: bitmap, quality },
          [bitmap]
        );
      } catch (err) {
        this.captureRequests.delete(requestId);
        bitmap.close();
        reject(err as Error);
      }
    });
  }

  async analyze(video: HTMLVideoElement, provider?: AIProvider): Promise<SceneAnalysis> {
    const selectedProvider = provider || this.getConfiguredProviders()[0];
    if (!selectedProvider) {
      throw new Error('No AI provider configured. Add an API key in settings.');
    }

    const base64Image = await this.captureFrame(video);

    switch (selectedProvider) {
      case 'openrouter':
        return this.analyzeWithOpenRouter(base64Image);
      default:
        throw new Error(`Unknown provider: ${selectedProvider}`);
    }
  }

  private async analyzeWithOpenRouter(base64Image: string): Promise<SceneAnalysis> {
    const key = this.keys.openrouter;
    if (!key) throw new Error('OpenRouter API key not configured');

    const model = this.keys.openrouterModel || 'google/gemini-flash-1.5-8b';

    const referer = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

    let response: Response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        mode: 'cors',
        referrer: referer,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'X-Title': 'Lumia Pro'
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: ANALYSIS_PROMPT },
              { type: 'image_url', image_url: { url: base64Image, detail: 'low' } }
            ]
          }],
          max_tokens: 500,
          temperature: 0.1
        })
      });
    } catch (err) {
      throw new Error('Network error talking to OpenRouter. Check CORS/connection and try again.');
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const text = Array.isArray(content)
      ? content.map((part: { text?: string }) => part?.text ?? '').join('\n').trim()
      : content;

    if (!text) throw new Error('Empty response from OpenRouter');
    const normalizedText = typeof text === 'string' ? text : JSON.stringify(text);

    return { ...this.parseResponse(normalizedText), provider: 'openrouter' };
  }

  private parseResponse(text: string): Omit<SceneAnalysis, 'provider'> {
    // Clean up response - remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsed = JSON.parse(cleaned);
      
      return {
        lighting: parsed.lighting || 'balanced',
        colorTemperature: parsed.colorTemperature || 'neutral',
        mood: parsed.mood || 'Unknown',
        suggestedAdjustments: {
          exposure: this.clamp(parsed.suggestedAdjustments?.exposure ?? 0, -1, 1),
          temperature: this.clamp(parsed.suggestedAdjustments?.temperature ?? 0, -1, 1),
          tint: this.clamp(parsed.suggestedAdjustments?.tint ?? 0, -1, 1),
          contrast: this.clamp(parsed.suggestedAdjustments?.contrast ?? 0, -0.5, 0.5),
          saturation: this.clamp(parsed.suggestedAdjustments?.saturation ?? 0, -0.5, 0.5),
        },
        suggestedLut: parsed.suggestedLut || null,
        compositionFeedback: parsed.compositionFeedback || '',
        confidence: this.clamp(parsed.confidence ?? 0.5, 0, 1),
      };
    } catch (e) {
      // Fallback: try to extract values from text format
      console.warn('[SceneDirector] JSON parse failed, attempting text extraction');
      
      const extractValue = (key: string, defaultValue: any) => {
        const regex = new RegExp(`${key}:\\s*([^\\n]+)`, 'i');
        const match = cleaned.match(regex);
        return match ? match[1].trim() : defaultValue;
      };

      const extractNumber = (key: string, defaultValue: number) => {
        const value = extractValue(key, defaultValue);
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
      };

      return {
        lighting: extractValue('lighting', 'balanced'),
        colorTemperature: extractValue('color temperature', 'neutral'),
        mood: extractValue('mood', 'Unknown'),
        suggestedAdjustments: {
          exposure: this.clamp(extractNumber('exposure', 0), -1, 1),
          temperature: this.clamp(extractNumber('temperature', 0), -1, 1),
          tint: this.clamp(extractNumber('tint', 0), -1, 1),
          contrast: this.clamp(extractNumber('contrast', 0), -0.5, 0.5),
          saturation: this.clamp(extractNumber('saturation', 0), -0.5, 0.5),
        },
        suggestedLut: extractValue('suggested lut', null),
        compositionFeedback: extractValue('composition feedback', ''),
        confidence: this.clamp(extractNumber('confidence', 0.5), 0, 1),
      };
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export const sceneDirectorService = new SceneDirectorService();
