// ============================================================================
// Global types for the app
// Note: MUI palette type extensions are in theme/ThemeContext.tsx
// ============================================================================
export interface DeviceInfo {
    deviceId: string;
    label: string;
}

export enum FallbackMode {
    GL_UNSUPPORTED = 'gl_unsupported',
    CAMERA_DENIED = 'camera_denied',
    CAMERA_NOT_FOUND = 'camera_not_found',
    MEDIAPIPE_FAILED = 'mediapipe_failed',
    RECORDING_FAILED = 'recording_failed',
    NETWORK_OFFLINE = 'network_offline',
    GENERIC_ERROR = 'generic_error'
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
    Heatmap = 'heatmap',
    RGBAParade = 'rgba_parade',
    Histogram = 'histogram'
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
    photoCountdown: number;
    maxFileSize?: number;
    burstCount: number;
    burstDelay: number;
}

export type AudioPreset = 'custom' | 'bandwidth_saver' | 'video_conference' | 'asmr' | 'podcast' | 'broadcast';

export interface AudioConfig {
    noiseSuppression: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;
    sampleRate: number;
    channelCount: 1 | 2;
    preset: AudioPreset;
}

export const AUDIO_PRESETS: Record<AudioPreset, Omit<AudioConfig, 'preset'>> = {
    custom: { noiseSuppression: false, echoCancellation: false, autoGainControl: false, sampleRate: 48000, channelCount: 2 },
    bandwidth_saver: { noiseSuppression: true, echoCancellation: true, autoGainControl: true, sampleRate: 16000, channelCount: 1 },
    video_conference: { noiseSuppression: true, echoCancellation: true, autoGainControl: true, sampleRate: 48000, channelCount: 1 },
    asmr: { noiseSuppression: false, echoCancellation: false, autoGainControl: false, sampleRate: 48000, channelCount: 2 },
    podcast: { noiseSuppression: true, echoCancellation: false, autoGainControl: true, sampleRate: 48000, channelCount: 1 },
    broadcast: { noiseSuppression: true, echoCancellation: true, autoGainControl: true, sampleRate: 48000, channelCount: 2 },
};

export interface BeautyConfig {
    enabled: boolean;
    smooth: number;
    eyeBrighten: number;
    faceThin: number;
    skinTone: number;
    cheekbones: number;
    lipsFuller: number;
    noseSlim: number;
    backgroundBlurStrength?: number;
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
    flipX: boolean;
    flipY: boolean;
}

export interface PresetData {
    color: Partial<ColorGradeParams>;
    transform?: Partial<TransformParams>;
}

export interface Preset {
    id: string;
    name: string;
    data: PresetData;
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

export interface BeautyParams {
    smoothStrength: number;
    eyeBrighten: number;
    faceThin: number;
    skinTone: number;
    cheekbones: number;
    lipsFuller: number;
    noseSlim: number;
    backgroundBlurStrength?: number;
}

export interface Point2D {
    x: number;
    y: number;
}

export interface RenderParams {
    color: ColorGradeParams;
    transform: TransformParams;
    mode: RenderMode;
    gyroAngle: number;
    bypass: boolean;
    wipePosition?: number; // A/B wipe: 0.0 = all processed, 1.0 = all bypass, 0.5 = split
    beauty?: BeautyParams;
    faceCenter?: Point2D;
    mouthCenter?: Point2D;
}

export type SidebarPosition = 'left' | 'right';

// PTZ (Pan-Tilt-Zoom) Types
export interface PTZCapabilities {
    hasPan: boolean;
    hasTilt: boolean;
    hasZoom: boolean;
    panRange?: { min: number; max: number };
    tiltRange?: { min: number; max: number };
    zoomRange?: { min: number; max: number };
}

export interface PTZState {
    pan: number;
    tilt: number;
    zoom: number;
    panSpeed: number;
    tiltSpeed: number;
    zoomSpeed: number;
}

export type PTZMode = 'virtual' | 'physical' | 'disabled';
