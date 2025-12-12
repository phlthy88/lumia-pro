/**
 * Gemini AI Service
 * 
 * Integration with Gemini Vision API for image analysis.
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

    try {
      const mimeType = imageDataUrl.substring(5, imageDataUrl.indexOf(';'));
      const base64Data = imageDataUrl.substring(imageDataUrl.indexOf(',') + 1);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

      const prompt = `Analyze this image and provide a description and a dictionary of suggestion values (0-1) for 'brightness', 'contrast', 'saturation', and 'sharpness'. Return only raw JSON matching this interface: { type: 'ml', description: string, suggestions: Record<string, number> }.`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
        throw new Error('Invalid response format from Gemini API');
      }

      let text = data.candidates[0].content.parts[0].text;

      // Remove markdown code blocks if present
      // Handle ```json ... ``` and ``` ... ```
      text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

      const result = JSON.parse(text) as GeminiAnalysisResult;

      // Basic validation
      if (result.type !== 'ml' || !result.description || !result.suggestions) {
         throw new Error('Invalid JSON structure from Gemini API');
      }

      return result;
    } catch (error) {
      console.error('Gemini analysis failed:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return isFeatureEnabled(Features.GEMINI_AI) && this.apiKey !== null;
  }

  isEnabled(): boolean {
    return isFeatureEnabled(Features.GEMINI_AI);
  }
}

export const geminiService = new GeminiService();
