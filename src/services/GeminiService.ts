/**
 * Gemini AI Service (Stub)
 * 
 * This is a placeholder for future Gemini Vision API integration.
 * Currently disabled - the app uses heuristic-based analysis instead.
 */

import { isFeatureEnabled, Features } from '../config/features';

export interface GeminiAnalysisResult {
  type: 'ml';
  description: string;
  suggestions: Record<string, number>;
}

export class GeminiService {
  private apiKey: string | null = null;

  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async analyzeImage(imageDataUrl: string): Promise<GeminiAnalysisResult> {
    if (!isFeatureEnabled(Features.GEMINI_AI)) {
      throw new Error('Gemini AI is disabled');
    }

    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // TODO: Implement actual Gemini Vision API call
    // This is a stub for future implementation
    throw new Error('Gemini integration not yet implemented');
  }

  isConfigured(): boolean {
    return isFeatureEnabled(Features.GEMINI_AI) && this.apiKey !== null;
  }

  isEnabled(): boolean {
    return isFeatureEnabled(Features.GEMINI_AI);
  }
}

export const geminiService = new GeminiService();
