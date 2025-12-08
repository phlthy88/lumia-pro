import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { ColorGradeParams } from "../types";

export interface ImageQualityScore {
  overall: number; // 0-100
  exposure: number; // 0-100
  focus: number; // 0-100
  composition: number; // 0-100
  color: number; // 0-100
}

export interface AnalysisResult {
  score: ImageQualityScore;
  tips: string[];
  autoParams: Partial<ColorGradeParams>; // The "Auto Fix" values
  faces: number;
}

export class AIAnalysisService {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private isAnalyzing = false; // Mutex to prevent concurrent analysis

  constructor() {
    // Small canvas for analysis (performance optimization)
    this.canvas = new OffscreenCanvas(256, 144); 
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
  }

  async analyze(video: HTMLVideoElement, faceResult?: FaceLandmarkerResult | null): Promise<AnalysisResult> {
    // Prevent concurrent analysis - shared canvas would corrupt data
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }
    this.isAnalyzing = true;

    try {
      // 1. Draw frame to small canvas for pixel analysis
      this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const pixels = imageData.data;

    // 2. Pixel Statistics (Exposure & Color)
    let rSum = 0, gSum = 0, bSum = 0, lumaSum = 0;
    let minLuma = 255, maxLuma = 0;
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]!;
      const g = pixels[i + 1]!;
      const b = pixels[i + 2]!;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      rSum += r; gSum += g; bSum += b;
      lumaSum += luma;
      if (luma < minLuma) minLuma = luma;
      if (luma > maxLuma) maxLuma = luma;
    }

    const pixelCount = pixels.length / 4;
    const avgLuma = lumaSum / pixelCount;
    const avgR = rSum / pixelCount;
    const avgG = gSum / pixelCount;
    const avgB = bSum / pixelCount;

    // 3. AI Face Detection (Composition & Focus)
    const faceData: FaceLandmarkerResult | null = faceResult ?? null;
    console.log('[AIAnalysisService] faceLandmarks length:', faceData?.faceLandmarks?.length ?? 0, 'sample point:', faceData?.faceLandmarks?.[0]?.[1]);

    // --- SCORING LOGIC ---
    
    const tips: string[] = [];
    const autoParams: Partial<ColorGradeParams> = {};
    
    // Exposure Analysis
    let exposureScore = 100;
    // Ideal luma is around 100-140 (out of 255)
    const lumaDiff = avgLuma - 128;
    
    if (avgLuma < 60) {
        tips.push("Scene is too dark. Add lighting or increase ISO.");
        autoParams.exposure = 0.5 + (60 - avgLuma) / 100; // Boost exposure
        autoParams.shadows = 0.2;
        exposureScore -= 40;
    } else if (avgLuma > 200) {
        tips.push("Scene is overexposed. Reduce gain.");
        autoParams.exposure = -0.5;
        autoParams.highlights = -0.3;
        exposureScore -= 40;
    } else {
        // Subtle auto-exposure correction
        autoParams.exposure = -lumaDiff / 255; 
    }

    // Contrast Analysis
    const dynamicRange = maxLuma - minLuma;
    if (dynamicRange < 150) {
        tips.push("Image looks flat. Increasing contrast.");
        autoParams.contrast = 1.15;
        autoParams.blacks = -0.1;
    }

    // Color/WB Analysis (Gray World Assumption)
    // Simple auto-WB: try to make average R, G, B equal
    const maxChan = Math.max(avgR, avgG, avgB);
    // Prevent division by zero for edge cases (pure color channels)
    const rGain = avgR > 0 ? maxChan / avgR : 1;
    const bGain = avgB > 0 ? maxChan / avgB : 1;
    
    // Map gains to Temp/Tint approximately
    if (avgR > avgB * 1.2) {
        tips.push("Image is too warm (Orange). Cooling down.");
        autoParams.temperature = -0.2;
    } else if (avgB > avgR * 1.2) {
        tips.push("Image is too cool (Blue). Warming up.");
        autoParams.temperature = 0.2;
    }

    // Face/Composition Analysis
    let compScore = 100;
    let focusScore = 80; // Baseline
    
    if (faceData && faceData.faceLandmarks.length > 0) {
        const face = faceData.faceLandmarks[0];
        // Nose tip is usually index 1 or 4
        const nose = face?.[1];
        
        // Check landmark exists before using it
        if (nose) {
            // Rule of Thirds check
            const xDist = Math.abs(nose.x - 0.5);
            const yDist = Math.abs(nose.y - 0.4); // Eyes usually around 40% height
            
            if (xDist > 0.15) {
                tips.push("You are off-center. Move to the center.");
                compScore -= 20;
            }
            if (yDist > 0.15) {
                tips.push("Headroom incorrect. Adjust camera tilt.");
                compScore -= 20;
            }
        } else {
            // Landmark confidence too low
            tips.push("Face landmark confidence too low. Improve lighting or distance.");
            compScore -= 10;
        }

        // Portrait Enhancement
        autoParams.portraitLight = 0.3;
        focusScore = 100; // Face found = good focus target
    } else {
        tips.push("No face detected. Cannot optimize for portrait.");
        compScore -= 50;
    }

    const overallScore = (exposureScore + compScore + focusScore) / 3;

    return {
      score: {
        overall: Math.round(overallScore),
        exposure: Math.round(exposureScore),
        focus: Math.round(focusScore),
        composition: Math.round(compScore),
        color: 90 // Placeholder
      },
      tips: tips.slice(0, 3), // Top 3 tips
      autoParams,
      faces: faceData?.faceLandmarks.length || 0
    };
    } finally {
      // Release mutex
      this.isAnalyzing = false;
    }
  }
}

export const aiService = new AIAnalysisService();
