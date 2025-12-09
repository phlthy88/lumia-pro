import { ColorGradeParams, TransformParams, RenderMode, EngineStats, LutData, RenderParams } from '../types';
import { GPUCapabilities, GPUTier, QualityProfile } from './GPUCapabilities';
import { AdaptiveQuality } from './AdaptiveQuality';

export class GLRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private videoSource: HTMLVideoElement | null = null;
    private overlaySource: HTMLCanvasElement | null = null;
    private beautyMaskSource: OffscreenCanvas | HTMLCanvasElement | null = null;
    private beautyMask2Source: OffscreenCanvas | HTMLCanvasElement | null = null;
    
    private program: WebGLProgram | null = null;
    private lutTexture: WebGLTexture | null = null;
    private beautyMaskTexture: WebGLTexture | null = null;
    private beautyMask2Texture: WebGLTexture | null = null;
    private textures: Map<string, WebGLTexture> = new Map();
    private positionBuffer: WebGLBuffer | null = null;
    private frameId: number | null = null;
    
    private isRunning = false;
    private startTime = 0;
    private lastFrameTime = 0;
    private frameCount = 0;
    private lastFpsUpdate = 0;
    private performanceMode = false;
    private supportsFloatLinear = false;
    private lastResizeTime = 0;
    private stableResizeCount = 0;

    // Quality and Adaptive Logic
    private gpuTier: GPUTier;
    private qualityProfile: QualityProfile;
    private adaptiveQuality: AdaptiveQuality;

    // Uniform locations cache
    private uniforms: Map<string, WebGLUniformLocation> = new Map();
    private contextLostHandler: ((e: Event) => void) | null = null;
    private recoveryTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { 
            alpha: false, 
            antialias: false,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        
        if (!gl) throw new Error("WebGL2 not supported");
        this.gl = gl;

        // Initialize GPU Capabilities and Adaptive Quality
        this.gpuTier = GPUCapabilities.getTier();
        this.qualityProfile = GPUCapabilities.getProfile(this.gpuTier);
        this.adaptiveQuality = new AdaptiveQuality();

        console.log(`[GLRenderer] GPU Tier: ${this.gpuTier}`, this.qualityProfile);
        
        // Handle context loss (critical for low-end Chromebooks)
        this.contextLostHandler = (e) => {
            e.preventDefault();
            this.stop();
            console.warn('WebGL context lost');
            
            // Attempt recovery after a short delay
            this.recoveryTimeout = setTimeout(() => {
                try {
                    const newContext = canvas.getContext('webgl2', { 
                        alpha: false, 
                        antialias: false,
                        preserveDrawingBuffer: true,
                        powerPreference: 'high-performance'
                    });
                    if (newContext) {
                        this.gl = newContext;
                        // Reset texture tracking state
                        this.textures.clear();
                        this.videoTextureInitialized = false;
                        this.lutTexture = null;
                        this.beautyMaskTexture = null;
                        this.beautyMask2Texture = null;
                        this.initShaders();
                        this.initBuffers();
                        console.log('WebGL context recovered - textures will reload on next frame');
                    }
                } catch (recoveryError) {
                    console.error('WebGL context recovery failed:', recoveryError);
                }
            }, 1000);
        };
        canvas.addEventListener('webglcontextlost', this.contextLostHandler);
        
        // Enable extensions for floating point textures (critical for LUTs)
        gl.getExtension('EXT_color_buffer_float');
        this.supportsFloatLinear = !!gl.getExtension('OES_texture_float_linear');

        this.initShaders();
        this.initBuffers();
    }

    public setPerformanceMode(enabled: boolean) {
        if (this.performanceMode !== enabled) {
            this.performanceMode = enabled;
            console.log(`Performance Mode: ${enabled ? 'ON' : 'OFF'}`);
        }
    }

    public setVideoSource(video: HTMLVideoElement) {
        this.videoSource = video;
        this.createTexture('video');
    }

    public setOverlaySource(canvas: HTMLCanvasElement) {
        this.overlaySource = canvas;
        this.createTexture('overlay');
    }

    public setBeautyMask(mask: OffscreenCanvas | HTMLCanvasElement | null) {
        this.beautyMaskSource = mask;
        if (!this.textures.get('beautyMask')) {
            this.createTexture('beautyMask');
        }
        const texture = this.textures.get('beautyMask');
        if (!texture) return;

        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        if (mask) {
            this.beautyMaskTexture = texture;
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, mask);
        } else {
            const empty = new Uint8Array([0, 0, 0, 0]);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, empty);
            this.beautyMaskTexture = texture;
        }
    }

    public setBeautyMask2(mask: OffscreenCanvas | HTMLCanvasElement | null) {
        this.beautyMask2Source = mask;
        if (!this.textures.get('beautyMask2')) {
            this.createTexture('beautyMask2');
        }
        const texture = this.textures.get('beautyMask2');
        if (!texture) return;

        this.gl.activeTexture(this.gl.TEXTURE4);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        if (mask) {
            this.beautyMask2Texture = texture;
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, mask);
        } else {
            const empty = new Uint8Array([0, 0, 0, 0]);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, empty);
            this.beautyMask2Texture = texture;
        }
    }

    public setLut(lut: LutData) {
        if (this.lutTexture) {
            this.gl.deleteTexture(this.lutTexture);
            this.lutTexture = null;
        }

        try {
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_3D, texture);
            
            // Fall back to RGB8 if float linear filtering not supported (common on Chromebooks)
            const useFloat = this.supportsFloatLinear && !this.performanceMode;
            const internalFormat = useFloat ? this.gl.RGB16F : this.gl.RGB8;
            const type = useFloat ? this.gl.FLOAT : this.gl.UNSIGNED_BYTE;
            
            let dataToUpload: Float32Array | Uint8Array = lut.data;

            if (!useFloat) {
                const uintData = new Uint8Array(lut.data.length);
                for(let i=0; i<lut.data.length; i++) {
                    uintData[i] = Math.floor(Math.max(0, Math.min(1, lut.data[i]!)) * 255);
                }
                dataToUpload = uintData;
            }

            this.gl.texImage3D(
                this.gl.TEXTURE_3D, 
                0, 
                internalFormat, 
                lut.size, lut.size, lut.size, 
                0, 
                this.gl.RGB, 
                type, 
                dataToUpload
            );
            
            // Check for GL errors
            const error = this.gl.getError();
            if (error !== this.gl.NO_ERROR) {
                throw new Error(`WebGL error: ${error}`);
            }

            this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);

            this.lutTexture = texture;
        } catch (e) {
            console.warn('[GLRenderer] 3D LUT texture failed, LUT disabled:', e);
            this.lutTexture = null;
        }
    }

    public start(
        // Note: gyroAngle is reserved for future gyroscope-based rotation feature
        getParams: () => { color: ColorGradeParams, transform: TransformParams, mode: RenderMode, gyroAngle: number, bypass: boolean, wipePosition?: number },
        onStats: (fps: number) => void,
        onDrawOverlay: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => boolean
    ) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = performance.now();

        const loop = (now: number) => {
            if (!this.isRunning) return;

            // Stats
            this.frameCount++;
            if (now - this.lastFpsUpdate >= 1000) {
                onStats(Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate)));

                // Adaptive Logic: Check frame time and adjust
                if (this.adaptiveQuality.shouldDownscale()) {
                    // Reduce resolution scale if struggling
                    if (this.qualityProfile.resolutionScale > 0.5) {
                        this.qualityProfile.resolutionScale -= 0.1;
                        console.warn('Downscaling resolution due to performance', this.qualityProfile.resolutionScale);
                        this.adaptiveQuality.reset();
                    }
                }

                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }

            // Track frame time
            const delta = now - this.lastFrameTime;
            this.adaptiveQuality.addFrameTime(delta);
            this.lastFrameTime = now;

            const params = getParams();
            const time = (now - this.startTime) / 1000;

            this.resize();
            
            if (this.videoSource && this.videoSource.videoWidth > 0 && this.videoSource.videoHeight > 0) {
                 this.updateVideoTexture();
                 this.updateOverlay(onDrawOverlay, time);
                 this.render(params, time);
            }

            this.frameId = requestAnimationFrame(loop);
        };

        this.frameId = requestAnimationFrame(loop);
    }

    public stop() {
        this.isRunning = false;
        if (this.frameId) cancelAnimationFrame(this.frameId);
    }

    public getQualityRecommendation() {
        return this.adaptiveQuality.getRecommendation();
    }

    public getAverageFps(): number {
        return this.adaptiveQuality.getAverageFps();
    }

    public dispose() {
        this.stop();
        
        // Remove event listener
        if (this.contextLostHandler) {
            this.canvas.removeEventListener('webglcontextlost', this.contextLostHandler);
            this.contextLostHandler = null;
        }
        
        // Clear recovery timeout
        if (this.recoveryTimeout) {
            clearTimeout(this.recoveryTimeout);
            this.recoveryTimeout = null;
        }
        
        if (this.program) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
        this.textures.forEach(t => this.gl.deleteTexture(t));
        this.textures.clear();
        if (this.lutTexture) {
            this.gl.deleteTexture(this.lutTexture);
            this.lutTexture = null;
        }
        if (this.positionBuffer) {
            this.gl.deleteBuffer(this.positionBuffer);
            this.positionBuffer = null;
        }
        this.uniforms.clear();
        
        // Clear video/overlay sources
        this.videoSource = null;
        this.overlaySource = null;
        this.beautyMaskSource = null;
        this.beautyMask2Source = null;

        // Ensure texture map references are cleared
        this.beautyMaskTexture = null;
        this.beautyMask2Texture = null;
    }

    private resize() {
        const now = performance.now();
        
        // Get the actual display dimensions
        let displayWidth = Math.floor(this.canvas.clientWidth);
        let displayHeight = Math.floor(this.canvas.clientHeight);

        // Apply Quality Profile Scale
        displayWidth = Math.floor(displayWidth * this.qualityProfile.resolutionScale);
        displayHeight = Math.floor(displayHeight * this.qualityProfile.resolutionScale);

        // Skip resize if dimensions are invalid or zero, reset counter
        if (displayWidth <= 0 || displayHeight <= 0) {
            this.stableResizeCount = 0;
            return;
        }

        // Check if resize is needed
        const needsResize = this.canvas.width !== displayWidth || this.canvas.height !== displayHeight;
        
        if (!needsResize) {
            // Dimensions are stable
            this.stableResizeCount++;
            return;
        }

        // Aggressive debouncing: only resize if dimensions have been stable for multiple frames
        // This prevents resize loops during CSS transitions and animations
        const timeSinceLastResize = now - this.lastResizeTime;
        if (timeSinceLastResize < 200 && this.stableResizeCount < 10) {
            // Skip this resize, wait for dimensions to stabilize
            return;
        }

        // Check if the size change is significant enough to warrant a resize
        const widthChangeRatio = Math.abs(displayWidth - this.canvas.width) / this.canvas.width;
        const heightChangeRatio = Math.abs(displayHeight - this.canvas.height) / this.canvas.height;
        
        // Only resize if change is significant (more than 5%)
        if (widthChangeRatio < 0.05 && heightChangeRatio < 0.05 && this.stableResizeCount < 20) {
            return;
        }

        // Perform resize
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        this.lastResizeTime = now;
        this.stableResizeCount = 0;
    }

    private initShaders() {
        try {
            const vsSource = `#version 300 es
            in vec2 a_position;
            out vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_position * 0.5 + 0.5;
                v_texCoord.y = 1.0 - v_texCoord.y; // Flip Y for WebGL
            }`;

            const fsSource = `#version 300 es
            precision ${this.qualityProfile.precision} float;
            precision ${this.qualityProfile.precision} sampler3D;

            in vec2 v_texCoord;
            
            uniform sampler2D u_videoTexture;
            uniform sampler2D u_overlayTexture;
            uniform sampler3D u_lutTexture;
            uniform sampler2D u_beautyMask;
            uniform sampler2D u_beautyMask2;
            
            uniform int u_mode;
            uniform int u_bypass;
            uniform float u_wipe_position;

            // Quality Scale Uniform
            uniform float u_qualityScale;

            uniform float u_skinSmoothStrength;
            uniform float u_eyeBrighten;
            uniform float u_faceThin;
            uniform float u_skinTone;
            uniform float u_cheekbones;
            uniform float u_lipsFuller;
            uniform float u_noseSlim;

            uniform vec2 u_faceCenter;
            uniform vec2 u_mouthCenter;

            // Color Grading
            uniform float u_exposure;
            uniform float u_contrast;
            uniform float u_saturation;
            uniform float u_temperature;
            uniform float u_tint;
            uniform float u_lift;
            uniform float u_gamma;
            uniform float u_gain;
            uniform float u_lutStrength;
            
            // Details & Optics
            uniform float u_sharpness;
            uniform float u_vignette;
            uniform float u_grain;
            uniform float u_distortion;
            uniform float u_denoise;
            uniform float u_portraitLight;
            uniform float u_time;
            
            // Transform
            uniform float u_zoom;
            uniform float u_rotate;
            uniform vec2 u_pan;
            uniform vec2 u_coverScale; // NEW: For object-fit: cover
            uniform float u_flipX;
            uniform float u_flipY;

            out vec4 outColor;

            float random(vec2 st) {
                return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
            }

            vec3 adjustExposure(vec3 color, float exposure) {
                return color * pow(2.0, exposure);
            }

            vec3 adjustContrast(vec3 color, float contrast) {
                return (color - 0.5) * contrast + 0.5;
            }

            vec3 adjustSaturation(vec3 color, float saturation) {
                float gray = dot(color, vec3(0.299, 0.587, 0.114));
                return mix(vec3(gray), color, saturation);
            }

            vec3 colorGrade(vec3 color) {
                color = adjustExposure(color, u_exposure);
                
                color.r *= 1.0 + u_temperature;
                color.b *= 1.0 - u_temperature;
                color.g *= 1.0 + u_tint;

                color = pow(color, vec3(1.0 / u_gamma));
                color = color * (1.0 - u_lift) + u_lift + u_gain;

                color = adjustContrast(color, u_contrast);
                color = adjustSaturation(color, u_saturation);

                return color;
            }

            vec3 applyLut(vec3 color) {
                vec3 lutColor = texture(u_lutTexture, color).rgb;
                return mix(color, lutColor, u_lutStrength);
            }

            // Bilateral filter for skin smoothing - preserves edges while smoothing
            vec3 applySkinSmoothing(vec2 uv, vec3 baseColor, float maskWeight) {
                if (maskWeight < 0.01 || u_skinSmoothStrength <= 0.0) return baseColor;
                
                vec2 texelSize = vec2(1.0) / vec2(textureSize(u_videoTexture, 0));
                vec3 result = vec3(0.0);
                float totalWeight = 0.0;
                
                // Bilateral filter parameters
                float sigmaSpatial = 2.0 + u_skinSmoothStrength * 4.0;
                float sigmaRange = 0.1 + u_skinSmoothStrength * 0.15;
                int radius = int(sigmaSpatial);
                
                float baseLuma = dot(baseColor, vec3(0.299, 0.587, 0.114));
                
                for (int x = -4; x <= 4; x++) {
                    for (int y = -4; y <= 4; y++) {
                        if (abs(x) > radius || abs(y) > radius) continue;
                        
                        vec2 offset = vec2(float(x), float(y)) * texelSize * 1.5;
                        vec3 sampleColor = texture(u_videoTexture, uv + offset).rgb;
                        float sampleLuma = dot(sampleColor, vec3(0.299, 0.587, 0.114));
                        
                        // Spatial weight (Gaussian)
                        float spatialDist = length(vec2(float(x), float(y)));
                        float spatialWeight = exp(-spatialDist * spatialDist / (2.0 * sigmaSpatial * sigmaSpatial));
                        
                        // Range weight (color similarity) - preserves edges
                        float lumaDiff = abs(sampleLuma - baseLuma);
                        float rangeWeight = exp(-lumaDiff * lumaDiff / (2.0 * sigmaRange * sigmaRange));
                        
                        float weight = spatialWeight * rangeWeight;
                        result += sampleColor * weight;
                        totalWeight += weight;
                    }
                }
                
                vec3 smoothed = result / max(totalWeight, 0.001);
                
                // High-frequency detail preservation
                vec3 detail = baseColor - smoothed;
                float detailPreserve = 1.0 - u_skinSmoothStrength * 0.7;
                smoothed = smoothed + detail * detailPreserve * 0.3;
                
                return mix(baseColor, smoothed, clamp(maskWeight * u_skinSmoothStrength, 0.0, 1.0));
            }

            vec3 applyEyeBrighten(vec3 color, float eyeMask) {
                if (eyeMask < 0.01 || u_eyeBrighten <= 0.0) return color;
                // Brighten and add sparkle to eyes
                float boost = 1.0 + u_eyeBrighten * 0.4;
                vec3 brightened = color * boost;
                // Increase saturation for vivid eyes
                float gray = dot(brightened, vec3(0.299, 0.587, 0.114));
                brightened = mix(vec3(gray), brightened, 1.0 + u_eyeBrighten * 0.25);
                // Add subtle highlight
                brightened += vec3(u_eyeBrighten * 0.05);
                return mix(color, clamp(brightened, 0.0, 1.0), eyeMask);
            }

            vec3 applySkinTone(vec3 color, float skinMask) {
                if (abs(u_skinTone) < 0.01 || skinMask < 0.01) return color;
                // Warm (+) adds red/yellow, cool (-) adds blue
                vec3 toned = color;
                toned.r += u_skinTone * skinMask * 0.1;
                toned.b -= u_skinTone * skinMask * 0.1;
                return toned;
            }

            vec2 applyFaceThin(vec2 uv, float contourMask) {
                if (u_faceThin <= 0.0 || contourMask < 0.01) return uv;
                float strength = contourMask * u_faceThin * 0.03;
                float dir = uv.x < u_faceCenter.x ? -1.0 : 1.0;
                return uv + vec2(dir * strength, 0.0);
            }

            vec2 applyCheekbones(vec2 uv, float cheekMask) {
                if (u_cheekbones <= 0.0 || cheekMask < 0.01) return uv;
                float strength = cheekMask * u_cheekbones * 0.02;
                float dir = uv.x < u_faceCenter.x ? -1.0 : 1.0;
                return uv + vec2(dir * strength, 0.0);
            }

            vec2 applyNoseSlim(vec2 uv, float noseMask) {
                if (u_noseSlim <= 0.0 || noseMask < 0.01) return uv;
                float strength = noseMask * u_noseSlim * 0.04;
                float dir = uv.x < u_faceCenter.x ? -1.0 : 1.0;
                return uv + vec2(dir * strength, 0.0);
            }

            vec2 applyLipsFuller(vec2 uv, float lipMask) {
                if (u_lipsFuller <= 0.0 || lipMask < 0.01) return uv;
                vec2 delta = uv - u_mouthCenter;
                float strength = lipMask * u_lipsFuller * 0.15;
                return uv - delta * strength;
            }

            void main() {
                vec2 uv = v_texCoord;
                uv -= 0.5;
                
                // Lens Distortion (barrel/pincushion)
                if (abs(u_distortion) > 0.001) {
                    float r = length(uv);
                    float distortionFactor = 1.0 + u_distortion * r * r;
                    uv *= distortionFactor;
                }
                
                // Apply Cover Scale (Aspect Ratio Correction)
                uv *= 1.0 / u_coverScale;
                
                // Apply User Transforms
                uv *= 1.0 / u_zoom;
                float s = sin(radians(u_rotate));
                float c = cos(radians(u_rotate));
                uv = mat2(c, -s, s, c) * uv;
                
                uv += 0.5;
                uv -= u_pan * 0.5;
                
                // Apply flip transforms
                if (u_flipX > 0.5) uv.x = 1.0 - uv.x;
                if (u_flipY > 0.5) uv.y = 1.0 - uv.y;

                // Check bounds (Hard crop outside texture)
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    outColor = vec4(0.0, 0.0, 0.0, 1.0);
                    return;
                }

                // Get beauty mask channels (R=skin, G=eyes, B=face contour)
                vec4 beautyMask = texture(u_beautyMask, uv);
                // Second mask (R=cheeks, G=lips, B=nose)
                vec4 beautyMask2 = texture(u_beautyMask2, uv);
                
                // Apply geometric distortions (UV warping)
                vec2 warpedUv = applyFaceThin(uv, beautyMask.b);
                warpedUv = applyCheekbones(warpedUv, beautyMask2.r);
                warpedUv = applyLipsFuller(warpedUv, beautyMask2.g);
                warpedUv = applyNoseSlim(warpedUv, beautyMask2.b);
                
                vec4 video = texture(u_videoTexture, warpedUv);
                vec3 color = video.rgb;

                // Beauty color effects
                color = applySkinSmoothing(warpedUv, color, beautyMask.r);
                color = applyEyeBrighten(color, beautyMask.g);
                color = applySkinTone(color, beautyMask.r);

                if (u_bypass == 0) {
                    color = colorGrade(color);
                    color = applyLut(color);
                }

                // --- Visualization Modes ---
                if (u_mode == 1) { // Focus Peaking
                    float kernel[9] = float[](
                        -1.0, -1.0, -1.0,
                        -1.0,  8.0, -1.0,
                        -1.0, -1.0, -1.0
                    );
                    vec2 onePixel = vec2(1.0) / vec2(textureSize(u_videoTexture, 0));
                    float edge = 0.0;
                    for(int i = 0; i < 3; i++) {
                        for(int j = 0; j < 3; j++) {
                             vec3 sampleC = texture(u_videoTexture, uv + vec2(i-1, j-1) * onePixel).rgb;
                             float gray = dot(sampleC, vec3(0.299, 0.587, 0.114));
                             edge += gray * kernel[i*3+j];
                        }
                    }
                    if (edge > 0.1) color = mix(color, vec3(0.0, 1.0, 0.0), 0.8);
                }

                if (u_mode == 2) { // Zebras
                    float luma = dot(color, vec3(0.299, 0.587, 0.114));
                    if (luma > 0.95) {
                        bool stripe = mod(gl_FragCoord.x + gl_FragCoord.y, 20.0) > 10.0;
                        if (stripe) color = vec3(1.0, 0.0, 0.0);
                    }
                }

                if (u_mode == 4) { // Heatmap
                     float luma = dot(color, vec3(0.299, 0.587, 0.114));
                     if (luma < 0.1) color = vec3(0.5, 0.0, 0.5);
                     else if (luma < 0.4) color = vec3(0.0, 0.0, 1.0);
                     else if (luma < 0.6) color = vec3(0.5);
                     else if (luma < 0.8) color = vec3(1.0, 1.0, 0.0);
                     else color = vec3(1.0, 0.0, 0.0);
                }

                if (u_mode == 5) { // RGBA Parade - show RGB channels side by side
                    vec2 paradeUv = uv;
                    vec3 paradeColor = vec3(0.0);
                    float section = floor(uv.x * 3.0);
                    paradeUv.x = fract(uv.x * 3.0);
                    vec3 samp = texture(u_videoTexture, paradeUv).rgb;
                    
                    // Draw waveform for each channel
                    float threshold = 0.02;
                    if (section == 0.0) {
                        // Red channel
                        if (abs(uv.y - (1.0 - samp.r)) < threshold) paradeColor.r = 1.0;
                    } else if (section == 1.0) {
                        // Green channel
                        if (abs(uv.y - (1.0 - samp.g)) < threshold) paradeColor.g = 1.0;
                    } else {
                        // Blue channel
                        if (abs(uv.y - (1.0 - samp.b)) < threshold) paradeColor.b = 1.0;
                    }
                    // Add grid lines
                    if (fract(uv.y * 10.0) < 0.02) paradeColor += vec3(0.1);
                    color = paradeColor;
                }

                if (u_mode == 6) { // Histogram overlay
                    // Sample multiple points to build histogram approximation
                    float rHist = 0.0, gHist = 0.0, bHist = 0.0;
                    for (int i = 0; i < 16; i++) {
                        vec2 sampleUv = vec2(float(i) / 16.0, uv.y);
                        vec3 sc = texture(u_videoTexture, sampleUv).rgb;
                        float binX = uv.x;
                        if (abs(sc.r - binX) < 0.05) rHist += 0.1;
                        if (abs(sc.g - binX) < 0.05) gHist += 0.1;
                        if (abs(sc.b - binX) < 0.05) bHist += 0.1;
                    }
                    // Show histogram at bottom, video above
                    if (uv.y > 0.75) {
                        float histY = (uv.y - 0.75) * 4.0;
                        vec3 histColor = vec3(0.0);
                        if (rHist > histY) histColor.r = 0.8;
                        if (gHist > histY) histColor.g = 0.8;
                        if (bHist > histY) histColor.b = 0.8;
                        color = mix(color * 0.3, histColor, 0.7);
                    }
                }

                // Sharpness (unsharp mask)
                if (u_sharpness > 0.0) {
                    vec2 onePixel = vec2(1.0) / vec2(textureSize(u_videoTexture, 0));
                    vec3 blur = (
                        texture(u_videoTexture, warpedUv + vec2(-onePixel.x, 0.0)).rgb +
                        texture(u_videoTexture, warpedUv + vec2(onePixel.x, 0.0)).rgb +
                        texture(u_videoTexture, warpedUv + vec2(0.0, -onePixel.y)).rgb +
                        texture(u_videoTexture, warpedUv + vec2(0.0, onePixel.y)).rgb
                    ) * 0.25;
                    color += (color - blur) * u_sharpness * 2.0;
                }

                // Denoise (simple blur on dark areas)
                if (u_denoise > 0.0) {
                    vec2 onePixel = vec2(1.0) / vec2(textureSize(u_videoTexture, 0));
                    vec3 blur = vec3(0.0);
                    for (int x = -1; x <= 1; x++) {
                        for (int y = -1; y <= 1; y++) {
                            blur += texture(u_videoTexture, warpedUv + vec2(float(x), float(y)) * onePixel).rgb;
                        }
                    }
                    blur /= 9.0;
                    float luma = dot(color, vec3(0.299, 0.587, 0.114));
                    float blendFactor = u_denoise * (1.0 - luma); // More denoise in shadows
                    color = mix(color, blur, clamp(blendFactor, 0.0, 0.5));
                }

                // Portrait Light (edge darkening with center brightening)
                if (u_portraitLight > 0.0) {
                    float dist = length(uv - 0.5);
                    float light = 1.0 + u_portraitLight * 0.3 * (1.0 - dist * 2.0);
                    color *= clamp(light, 0.8, 1.3);
                }

                // Grain
                if (u_grain > 0.0) {
                    float noise = random(uv + u_time) - 0.5;
                    color += noise * u_grain * 0.3;
                }

                // Vignette
                if (u_vignette > 0.0) {
                    float dist = length(uv - 0.5) * 1.4;
                    color *= mix(1.0, smoothstep(0.8, 0.2, dist), u_vignette);
                }

                // Overlay (UI is always fit to screen, so use v_texCoord directly)
                vec4 overlay = texture(u_overlayTexture, v_texCoord); 
                color = mix(color, overlay.rgb, overlay.a);

                // A/B Wipe comparison
                vec3 finalColor = color;
                if (u_wipe_position > 0.0 && u_wipe_position < 1.0) {
                    vec3 originalColor = texture(u_videoTexture, uv).rgb;
                    if (uv.x > u_wipe_position) {
                        finalColor = originalColor;
                    }
                    // Draw wipe line
                    if (abs(uv.x - u_wipe_position) < 0.003) {
                        finalColor = vec3(1.0);
                    }
                }

                outColor = vec4(finalColor, 1.0);
            }`;

            const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
            const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
            
            const program = this.gl.createProgram();
            if (!program) throw new Error("Failed to create program");
            
            this.gl.attachShader(program, vs);
            this.gl.attachShader(program, fs);
            this.gl.linkProgram(program);

            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                const linkError = this.gl.getProgramInfoLog(program) || "Link Error";
                throw new Error(`Shader link failed: ${linkError}`);
            }

            // Clean up shaders - they're no longer needed after linking
            this.gl.detachShader(program, vs);
            this.gl.detachShader(program, fs);
            this.gl.deleteShader(vs);
            this.gl.deleteShader(fs);

            this.program = program;
        } catch (error) {
            console.error('Shader initialization failed:', error);
            // Fallback to basic shader that should work on all devices
            this.initFallbackShaders();
        }
    }

    private initFallbackShaders() {
        // Basic fallback shader that should work on all WebGL2 devices
        const vsSource = `#version 300 es
        in vec2 a_position;
        out vec2 v_texCoord;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_position * 0.5 + 0.5;
            v_texCoord.y = 1.0 - v_texCoord.y;
        }`;

        const fsSource = `#version 300 es
        precision mediump float;
        in vec2 v_texCoord;
        uniform sampler2D u_videoTexture;
        uniform int u_bypass;
        out vec4 outColor;
        
        void main() {
            outColor = texture(u_videoTexture, v_texCoord);
        }`;

        const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
        
        const program = this.gl.createProgram();
        if (!program) throw new Error("Failed to create fallback program");
        
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error("Fallback shader link failed");
        }

        this.gl.detachShader(program, vs);
        this.gl.detachShader(program, fs);
        this.gl.deleteShader(vs);
        this.gl.deleteShader(fs);

        this.program = program;
    }

    private compileShader(type: number, source: string) {
        const shader = this.gl.createShader(type);
        if (!shader) throw new Error("Failed to create shader");
        
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            console.error("Shader compile error:", error);
            console.error("Shader source:", source);
            throw new Error(error || "Compile Error");
        }
        return shader;
    }

    private initBuffers() {
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]);

        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const positionLoc = this.gl.getAttribLocation(this.program!, 'a_position');
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);
    }

    private createTexture(name: string) {
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.textures.set(name, texture!);
    }

    private videoTextureInitialized = false;
    private lastVideoWidth = 0;
    private lastVideoHeight = 0;

    private updateVideoTexture() {
        if (!this.videoSource) return;
        
        // Ensure video has valid data before uploading
        const w = this.videoSource.videoWidth;
        const h = this.videoSource.videoHeight;
        if (w === 0 || h === 0 || this.videoSource.readyState < 2) return;
        
        const texture = this.textures.get('video');
        if (!texture) return;

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        // Always use texImage2D for video - texSubImage2D causes Chrome errors with video elements
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.videoSource);
        this.videoTextureInitialized = true;
        this.lastVideoWidth = w;
        this.lastVideoHeight = h;
    }

    private updateOverlay(drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => boolean, time: number) {
        if (!this.overlaySource) return;
        
        if (this.overlaySource.width !== this.canvas.width || this.overlaySource.height !== this.canvas.height) {
            this.overlaySource.width = this.canvas.width;
            this.overlaySource.height = this.canvas.height;
        }

        if (this.overlaySource.width === 0 || this.overlaySource.height === 0) return;

        const ctx = this.overlaySource.getContext('2d');
        if (!ctx) return;

        const needsUpdate = drawFn(ctx, this.canvas.width, this.canvas.height, time);

        if (needsUpdate) {
            const texture = this.textures.get('overlay');
            if (texture) {
                this.gl.activeTexture(this.gl.TEXTURE1);
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.overlaySource);
            }
        }
    }

    private render(params: RenderParams, time: number) {
        if (!this.program) return;
        this.gl.useProgram(this.program);

        const setUniform1f = (name: string, val: number) => this.gl.uniform1f(this.getUniformLoc(name), val);
        const setUniform1i = (name: string, val: number) => this.gl.uniform1i(this.getUniformLoc(name), val);
        
        setUniform1i('u_videoTexture', 0);
        setUniform1i('u_overlayTexture', 1);
        setUniform1i('u_lutTexture', 2);
        setUniform1i('u_beautyMask', 3);
        setUniform1i('u_beautyMask2', 4);

        setUniform1i('u_mode', this.getModeInt(params.mode));
        setUniform1i('u_bypass', params.bypass ? 1 : 0);
        setUniform1f('u_wipe_position', params.wipePosition ?? 0);

        setUniform1f('u_qualityScale', this.qualityProfile.resolutionScale);

        setUniform1f('u_skinSmoothStrength', params.beauty?.smoothStrength ?? 0);
        setUniform1f('u_eyeBrighten', params.beauty?.eyeBrighten ?? 0);
        setUniform1f('u_faceThin', params.beauty?.faceThin ?? 0);
        setUniform1f('u_skinTone', params.beauty?.skinTone ?? 0);
        setUniform1f('u_cheekbones', params.beauty?.cheekbones ?? 0);
        setUniform1f('u_lipsFuller', params.beauty?.lipsFuller ?? 0);
        setUniform1f('u_noseSlim', params.beauty?.noseSlim ?? 0);

        this.gl.uniform2f(this.getUniformLoc('u_faceCenter'), params.faceCenter?.x ?? 0.5, params.faceCenter?.y ?? 0.5);
        this.gl.uniform2f(this.getUniformLoc('u_mouthCenter'), params.mouthCenter?.x ?? 0.5, params.mouthCenter?.y ?? 0.7);

        setUniform1f('u_exposure', params.color.exposure);
        setUniform1f('u_contrast', params.color.contrast);
        setUniform1f('u_saturation', params.color.saturation);
        setUniform1f('u_temperature', params.color.temperature);
        setUniform1f('u_tint', params.color.tint);
        setUniform1f('u_lift', params.color.lift);
        setUniform1f('u_gamma', params.color.gamma + 1.0);
        setUniform1f('u_gain', params.color.gain);
        setUniform1f('u_lutStrength', params.color.lutStrength);

        // Details & Optics
        setUniform1f('u_sharpness', params.color.sharpness ?? 0);
        setUniform1f('u_vignette', params.color.vignette ?? 0);
        setUniform1f('u_grain', params.color.grain ?? 0);
        setUniform1f('u_distortion', params.color.distortion ?? 0);
        setUniform1f('u_denoise', params.color.denoise ?? 0);
        setUniform1f('u_portraitLight', params.color.portraitLight ?? 0);
        setUniform1f('u_time', time);

        setUniform1f('u_zoom', params.transform.zoom);
        setUniform1f('u_rotate', params.transform.rotate);
        this.gl.uniform2f(this.getUniformLoc('u_pan'), params.transform.panX, params.transform.panY);
        setUniform1f('u_flipX', params.transform.flipX ? 1.0 : 0.0);
        setUniform1f('u_flipY', params.transform.flipY ? 1.0 : 0.0);
        
        // --- Calculate Cover Scale ---
        let scaleX = 1.0;
        let scaleY = 1.0;
        if (this.videoSource && this.videoSource.videoWidth > 0 && this.videoSource.videoHeight > 0 &&
            this.canvas.width > 0 && this.canvas.height > 0) {
            const canvasAspect = this.canvas.width / this.canvas.height;
            const videoAspect = this.videoSource.videoWidth / this.videoSource.videoHeight;
            
            if (canvasAspect > videoAspect) {
                scaleY = canvasAspect / videoAspect;
            } else {
                scaleX = videoAspect / canvasAspect;
            }
        }
        this.gl.uniform2f(this.getUniformLoc('u_coverScale'), scaleX, scaleY);


        if (this.lutTexture) {
            this.gl.activeTexture(this.gl.TEXTURE2);
            this.gl.bindTexture(this.gl.TEXTURE_3D, this.lutTexture);
        }

        if (this.beautyMaskTexture) {
            this.gl.activeTexture(this.gl.TEXTURE3);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.beautyMaskTexture);
        }

        if (this.beautyMask2Texture) {
            this.gl.activeTexture(this.gl.TEXTURE4);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.beautyMask2Texture);
        }

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    private getUniformLoc(name: string) {
        if (!this.uniforms.has(name)) {
            this.uniforms.set(name, this.gl.getUniformLocation(this.program!, name)!);
        }
        return this.uniforms.get(name)!;
    }

    private getModeInt(mode: RenderMode): number {
        switch(mode) {
            case RenderMode.Standard: return 0;
            case RenderMode.FocusPeaking: return 1;
            case RenderMode.Zebras: return 2;
            case RenderMode.Level: return 3;
            case RenderMode.Heatmap: return 4;
            case RenderMode.RGBAParade: return 5;
            case RenderMode.Histogram: return 6;
            default: return 0;
        }
    }
}
