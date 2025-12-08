// ============================================================================
// Global types for the app
// Note: MUI palette type extensions are in theme/ThemeContext.tsx
// ============================================================================
export interface DeviceInfo {
    deviceId: string;
    label: string;
}

export interface LutData {
  name: string;
  size: number;
  data: Float32Array;
}

export enum RenderMode {
    Standard = 'standard',
    FocusPeaking = 'focus_peaking',
    Zebras = 'zebras',
    Level = 'level',
    Heatmap = 'heatmap'
}

export enum GridType {
    None = 'None',
    RuleOfThirds = 'Rule of Thirds',
    GoldenRatio = 'Rule of Golden Ratio',
    Crosshair = 'Rule of Crosshair'
}

export enum AspectRatio {
    Free = 'Free',
    Native = 'Native',
    SixteenByNine = '16:9',
    FourByThree = '4:3',
    OneByOne = '1:1',
    TwoThirtyFive = '2.35:1',
    Vertical = '9:16'
}

export interface OverlayConfig {
    grid: GridType;
    aspectRatio: AspectRatio;
    safeArea: boolean;
    timecode: boolean;
}

export interface RecorderConfig {
    mimeType: string;
    bitrate: number;
    audioSource: string;
    countdown: number;
    maxFileSize?: number;
    burstCount: number;
    burstDelay: number;
}

export interface BeautyConfig {
    enabled: boolean;
    smooth: number;
    eyeBrighten: number;
    faceThin: number;
    skinTone: number;
}

export interface ColorGradeParams {
    exposure: number;
    temperature: number;
    tint: number;
    contrast: number;
    saturation: number;
    lift: number;
    gamma: number;
    gain: number;
    highlightRoll: number;
    shadowRoll: number;
    vignette: number;
    grain: number;
    lutStrength: number;
    sharpness: number;
    distortion: number;
    denoise: number;
    portraitLight: number;
    highlights: number;
    shadows: number;
    blacks: number;
    skinSmoothing: number;
}

export interface TransformParams {
    zoom: number;
    rotate: number;
    panX: number;
    panY: number;
}

export interface Preset {
    id: string;
    name: string;
    data: any;
    timestamp?: number;
    isFactory?: boolean;
}

export interface CameraCapabilities {
    hasTorch: boolean;
    hasStabilization: boolean;
    hasFocus: boolean;
    hasExposure: boolean;
    hasExposureCompensation: boolean;
    hasWhiteBalance: boolean;
    hasZoom: boolean;
    minFocusDistance: number;
    maxFocusDistance: number;
    minExposureCompensation: number;
    maxExposureCompensation: number;
    minExposureDuration: number;
    maxExposureDuration: number;
    minIso: number;
    maxIso: number;
    maxWidth?: number;
    maxHeight?: number;
    maxFrameRate?: number;
}

export interface HardwareState {
    torch: boolean;
    stabilization: boolean;
    focusMode: 'manual' | 'continuous' | 'single-shot' | 'none';
    focusDistance: number;
    exposureMode: 'manual' | 'continuous' | 'none';
    shutterSpeed: number;
    iso: number;
    exposureCompensation: number;
    whiteBalanceMode: 'manual' | 'continuous' | 'single-shot' | 'none';
    colorTemperature: number;
}

export interface EngineStats {
    fps: number;
    resolution: string;
    frameTime: number;
    droppedFrames: number;
}

export type SidebarPosition = 'left' | 'right';
