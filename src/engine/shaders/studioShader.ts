

export const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const fragmentShaderSource = `#version 300 es
precision mediump float;
precision mediump sampler3D;

in vec2 v_texCoord;
uniform sampler2D u_image;
uniform sampler2D u_overlay; // Layer 2 HUD
uniform sampler3D u_lut; // The 3D LUT

uniform float u_time;
uniform vec2 u_resolution; 

// Color Params
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_tint;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_blacks;
uniform float u_lift;
uniform float u_gamma;
uniform float u_gain;
uniform float u_vignette;
uniform float u_sharpness;
uniform float u_denoise;
uniform float u_grain;
uniform float u_portrait_light;
uniform float u_distortion;
uniform float u_lut_strength;
uniform float u_skin_smoothing;
uniform sampler2D u_beautyMask;
uniform sampler2D u_beautyMask2;
uniform float u_lips_fuller;
uniform float u_nose_slim;
uniform float u_cheekbones;

// Transform Params
uniform float u_zoom;
uniform vec2 u_pan;
uniform float u_rotate;

// Mode
uniform int u_mode; 
uniform float u_gyro_angle; 
uniform bool u_bypass;

out vec4 outColor;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float random(vec2 uv) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

float skinMask(vec3 color) {
    vec3 hsv = rgb2hsv(color);
    float hue = hsv.x * 360.0;
    float sat = hsv.y;
    float val = hsv.z;
    
    // Skin hue target ~25° with wrap-around handling
    float targetHue = 25.0;
    float hueDist = min(abs(hue - targetHue), 360.0 - abs(hue - targetHue));
    float hueMatch = 1.0 - smoothstep(0.0, 35.0, hueDist);
    
    // Skin typically has moderate saturation and value
    float satMatch = smoothstep(0.1, 0.25, sat) * (1.0 - smoothstep(0.6, 0.8, sat));
    float valMatch = smoothstep(0.2, 0.35, val) * (1.0 - smoothstep(0.9, 1.0, val));
    
    return hueMatch * satMatch * valMatch;
}

vec2 rotateUV(vec2 uv, float angle) {
    uv -= 0.5;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    uv = rot * uv;
    uv += 0.5;
    return uv;
}

vec2 distortUV(vec2 uv, float k) {
    vec2 t = uv - 0.5;
    float r2 = dot(t, t);
    float f = 1.0 + k * r2;
    return t * f + 0.5;
}

// Broadcast Standard False Color (IRE Approximation)
vec3 falseColorIRE(float y) {
    vec3 c = vec3(0.0);
    if (y < 0.05) c = vec3(0.5, 0.0, 0.5); // Purple
    else if (y < 0.15) c = mix(vec3(0.5, 0.0, 0.5), vec3(0.0, 0.0, 1.0), (y - 0.05) * 10.0);
    else if (y < 0.35) c = vec3(0.0, 0.0, 1.0); // Blue
    else if (y < 0.45) c = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 0.5, 0.0), (y - 0.35) * 10.0); 
    else if (y < 0.55) c = vec3(0.0, 0.5, 0.0); // Green
    else if (y < 0.60) c = mix(vec3(0.0, 0.5, 0.0), vec3(1.0, 0.4, 0.6), (y - 0.55) * 20.0);
    else if (y < 0.70) c = vec3(1.0, 0.4, 0.6); // Pink
    else if (y < 0.85) c = vec3(0.5); // Grey
    else if (y < 0.95) c = vec3(1.0, 1.0, 0.0); // Yellow
    else c = vec3(1.0, 0.0, 0.0); // Red
    return c;
}

void main() {
  vec2 uv = v_texCoord;
  
  // --- 1. GEOMETRY & TRANSFORM ---
  vec2 transUV = (uv - 0.5) / u_zoom + 0.5;
  transUV -= u_pan * 0.5 / u_zoom;
  if (u_rotate != 0.0) transUV = rotateUV(transUV, -u_rotate); 
  
  // Lens Distortion (Barrel/Pincushion)
  if (u_distortion != 0.0) {
      transUV = distortUV(transUV, u_distortion * 0.5);
  }

  vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);

  // Check bounds after transform
  if (transUV.x >= 0.0 && transUV.x <= 1.0 && transUV.y >= 0.0 && transUV.y <= 1.0) {
      vec4 baseColor = texture(u_image, transUV);
      
      if (u_bypass) {
          finalColor = baseColor;
      } else {
          vec3 color = baseColor.rgb;
          vec2 texelSize = 1.0 / u_resolution;

          // --- 2. OPTICS ---
          
          // Smart Bilateral Denoise (Edge Preserving)
          if (u_denoise > 0.0) {
            vec3 center = color;
            vec3 d_sum = vec3(0.0);
            float total_weight = 0.0;
            
            // 3x3 kernel approximation for performance
            for(int i = -1; i <= 1; i++) {
                for(int j = -1; j <= 1; j++) {
                    vec2 offset = vec2(float(i), float(j)) * texelSize;
                    vec3 neighbor = texture(u_image, transUV + offset).rgb;
                    
                    // Spatial weight is implicit in small kernel
                    // Range weight: weight drops if neighbor color is too different from center
                    float dist = distance(center, neighbor);
                    float weight = 1.0 - smoothstep(0.0, 0.15, dist); 
                    
                    d_sum += neighbor * weight;
                    total_weight += weight;
                }
            }
            // Mix original with smart blur based on slider
            color = mix(color, d_sum / max(total_weight, 0.001), u_denoise);
          }

          // Sharpness (Unsharp Mask)
          if (u_sharpness > 0.0) {
            vec3 center = color;
            vec3 neighbors = texture(u_image, transUV + vec2(0.0, -texelSize.y)).rgb +
                              texture(u_image, transUV + vec2(0.0, texelSize.y)).rgb +
                              texture(u_image, transUV + vec2(-texelSize.x, 0.0)).rgb +
                              texture(u_image, transUV + vec2(texelSize.x, 0.0)).rgb;
            color = mix(color, center * 5.0 - neighbors, u_sharpness);
          }

          // --- 3. COLOR GRADING ---

          // Lift (Shadows offset)
          color = color + (vec3(u_lift) * 0.2); 
          
          // Gain (Highlights multiply)
          color = color * (1.0 + vec3(u_gain));
          
          // Gamma (Midtones power)
          vec3 gammaSafe = vec3(1.0) - (vec3(u_gamma) * 0.5); 
          color = pow(max(color, vec3(0.0)), gammaSafe);

          // Exposure
          color *= pow(2.0, u_exposure);

          // White Balance
          color.r += u_temperature * 0.2;
          color.b -= u_temperature * 0.2;
          color.g -= u_tint * 0.2;

          // Contrast
          color = (color - 0.5) * u_contrast + 0.5;

          // Tone Mapping
          float lum = luma(color);
          color += vec3(u_shadows * 0.2 * (1.0 - smoothstep(0.0, 0.5, lum)));
          color -= vec3(u_highlights * 0.2 * smoothstep(0.5, 1.0, lum));
          color -= vec3(u_blacks * 0.15);

          // Portrait Light
          if (u_portrait_light > 0.0) {
              float centerDist = distance(transUV, vec2(0.5));
              float light = 1.0 - smoothstep(0.0, 0.65, centerDist); 
              color += color * light * u_portrait_light * 0.4;
              color += vec3(0.1, 0.05, 0.02) * light * u_portrait_light * 0.5;
          }

          // --- 3.5 3D LUT ---
          if (u_lut_strength > 0.0) {
              // Apply LUT using 3D texture lookup
              // WebGL 2.0 handles the trilinear interpolation for us
              vec3 lutColor = texture(u_lut, color).rgb;
              color = mix(color, lutColor, u_lut_strength);
          }

          // Saturation
          float gray = luma(color);
          color = mix(vec3(gray), color, u_saturation);

          // Skin Smoothing (preserves skin tones during grading)
          if (u_skin_smoothing > 0.0) {
              float skin = skinMask(color);
              vec3 smoothed = vec3(0.0);
              float total = 0.0;
              for(int i = -1; i <= 1; i++) {
                  for(int j = -1; j <= 1; j++) {
                      vec2 off = vec2(float(i), float(j)) * texelSize * 2.0;
                      smoothed += texture(u_image, transUV + off).rgb;
                      total += 1.0;
                  }
              }
              smoothed /= total;
              color = mix(color, smoothed, skin * u_skin_smoothing);
          }

          // Grain
          if (u_grain > 0.0) {
            color += (random(transUV + u_time) - 0.5) * u_grain * 0.2;
          }

          // Vignette
          float dist = distance(transUV, vec2(0.5));
          color *= mix(1.0, smoothstep(0.8, 0.2, dist * (1.0 + u_vignette)), u_vignette);

          color = clamp(color, 0.0, 1.0);

          // --- 4. ANALYTIC OVERLAYS ---
          // Using branchless logic/mix where possible for better GPU coherency, but mode switch is uniform so if/else is fine
          if (u_mode == 1) { 
            // Peaking
            vec3 diff = abs(texture(u_image, transUV + vec2(texelSize.x, 0.0)).rgb - texture(u_image, transUV - vec2(texelSize.x, 0.0)).rgb);
            if (dot(diff, vec3(1.0)) > 0.2) color = mix(color, vec3(0.0, 1.0, 0.0), 0.8);
            else color = vec3(luma(color));
          } else if (u_mode == 2) {
            // Zebras
            if (luma(color) > 0.95 && fract((gl_FragCoord.x + gl_FragCoord.y) / 20.0) > 0.5) color = vec3(1.0, 0.0, 0.0);
          } else if (u_mode == 3) {
              // Level (Gyro) - Draw simple horizon line
              vec2 sUV = v_texCoord - 0.5;
              if (abs(dot(sUV, vec2(sin(u_gyro_angle), cos(u_gyro_angle)))) < 0.002) color = vec3(0.0, 1.0, 1.0);
          } else if (u_mode == 4) {
              // False Color
              color = falseColorIRE(luma(color));
          }

          finalColor = vec4(color, 1.0);
      }
  }

  // --- 5. HUD COMPOSITING (Layer 2) ---
  vec4 overlayColor = texture(u_overlay, vec2(v_texCoord.x, 1.0 - v_texCoord.y));
  outColor = mix(finalColor, vec4(overlayColor.rgb, 1.0), overlayColor.a);
}
`;
