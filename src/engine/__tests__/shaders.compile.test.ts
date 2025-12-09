import { describe, it, expect } from 'vitest';
import { vertexShaderSource, fragmentShaderSource } from '../shaders/studioShader';

// Alias for clarity
const VERTEX_SHADER = vertexShaderSource;
const FRAGMENT_SHADER = fragmentShaderSource;

describe('Shader compilation', () => {
  describe('Vertex shader', () => {
    it('has valid GLSL structure', () => {
      expect(VERTEX_SHADER).toContain('gl_Position');
      expect(VERTEX_SHADER).toContain('void main');
    });

    it('declares position attribute', () => {
      expect(VERTEX_SHADER).toMatch(/in\s+vec2\s+a_position/);
    });

    it('declares texture coordinate output', () => {
      expect(VERTEX_SHADER).toMatch(/out\s+vec2\s+v_texCoord/);
    });

    it('has version directive', () => {
      expect(VERTEX_SHADER).toMatch(/#version\s+300\s+es/);
    });
  });

  describe('Fragment shader', () => {
    it('has valid GLSL structure', () => {
      expect(FRAGMENT_SHADER).toContain('void main');
    });

    it('declares output color', () => {
      // WebGL2 uses out vec4
      expect(FRAGMENT_SHADER).toMatch(/out\s+vec4\s+\w+/);
    });

    it('has version directive', () => {
      expect(FRAGMENT_SHADER).toMatch(/#version\s+300\s+es/);
    });

    it('declares precision', () => {
      expect(FRAGMENT_SHADER).toMatch(/precision\s+(highp|mediump)\s+float/);
    });

    it('declares image sampler uniform', () => {
      expect(FRAGMENT_SHADER).toMatch(/uniform\s+sampler2D\s+u_image/);
    });

    it('declares LUT sampler uniform', () => {
      expect(FRAGMENT_SHADER).toMatch(/uniform\s+sampler3D\s+u_lut/);
    });
  });

  describe('Uniform declarations', () => {
    it('declares exposure uniform', () => {
      expect(FRAGMENT_SHADER).toMatch(/uniform\s+float\s+u_exposure/);
    });

    it('declares contrast uniform', () => {
      expect(FRAGMENT_SHADER).toMatch(/uniform\s+float\s+u_contrast/);
    });

    it('declares saturation uniform', () => {
      expect(FRAGMENT_SHADER).toMatch(/uniform\s+float\s+u_saturation/);
    });

    it('declares temperature uniform', () => {
      expect(FRAGMENT_SHADER).toMatch(/uniform\s+float\s+u_temperature/);
    });
  });

  describe('Shader syntax', () => {
    it('has balanced braces in vertex shader', () => {
      const openBraces = (VERTEX_SHADER.match(/{/g) || []).length;
      const closeBraces = (VERTEX_SHADER.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    it('has balanced braces in fragment shader', () => {
      const openBraces = (FRAGMENT_SHADER.match(/{/g) || []).length;
      const closeBraces = (FRAGMENT_SHADER.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    it('has balanced parentheses in vertex shader', () => {
      const openParens = (VERTEX_SHADER.match(/\(/g) || []).length;
      const closeParens = (VERTEX_SHADER.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it('has balanced parentheses in fragment shader', () => {
      const openParens = (FRAGMENT_SHADER.match(/\(/g) || []).length;
      const closeParens = (FRAGMENT_SHADER.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it('does not contain common syntax errors', () => {
      expect(FRAGMENT_SHADER).not.toContain(';;');
      expect(VERTEX_SHADER).not.toContain(';;');
    });
  });
});
