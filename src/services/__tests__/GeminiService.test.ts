import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiService, GeminiAnalysisResult } from '../GeminiService';
import * as features from '../../config/features';

describe('GeminiService', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    geminiService = new GeminiService();
    vi.spyOn(features, 'isFeatureEnabled').mockReturnValue(true);
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error if Gemini AI feature is disabled', async () => {
    vi.spyOn(features, 'isFeatureEnabled').mockReturnValue(false);
    await expect(geminiService.analyzeImage('data:image/jpeg;base64,123')).rejects.toThrow('Gemini AI is disabled');
  });

  it('should throw error if API key is not configured', async () => {
    await expect(geminiService.analyzeImage('data:image/jpeg;base64,123')).rejects.toThrow('Gemini API key not configured');
  });

  it('should analyze image successfully', async () => {
    const apiKey = 'test-api-key';
    geminiService.configure(apiKey);
    const mockResult = {
      type: 'ml',
      description: 'A test image description',
      suggestions: { brightness: 0.5, contrast: 0.8 }
    };

    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify(mockResult)
              }
            ]
          }
        }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const imageDataUrl = 'data:image/jpeg;base64,abc12345';
    const result = await geminiService.analyzeImage(imageDataUrl);

    expect(result).toEqual(mockResult);

    // Verify fetch call
    expect(global.fetch).toHaveBeenCalledWith(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"mime_type":"image/jpeg"')
      })
    );

    // Verify the base64 data extraction
    const calledBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(calledBody.contents[0].parts[1].inline_data.data).toBe('abc12345');
  });

  it('should handle API errors', async () => {
    geminiService.configure('test-key');

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: { message: 'Invalid argument' } })
    });

    await expect(geminiService.analyzeImage('data:image/png;base64,123')).rejects.toThrow('Gemini API error: 400 Bad Request');
  });

  it('should handle malformed JSON response', async () => {
    geminiService.configure('test-key');

    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "This is not JSON"
              }
            ]
          }
        }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    await expect(geminiService.analyzeImage('data:image/jpeg;base64,123')).rejects.toThrow();
  });

  it('should handle response with markdown code blocks', async () => {
    geminiService.configure('test-key');
    const mockResult = {
        type: 'ml',
        description: 'Description',
        suggestions: {}
    };

    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "```json\n" + JSON.stringify(mockResult) + "\n```"
              }
            ]
          }
        }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const result = await geminiService.analyzeImage('data:image/jpeg;base64,123');
    expect(result).toEqual(mockResult);
  });
});
