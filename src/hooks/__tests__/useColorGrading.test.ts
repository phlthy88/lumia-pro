import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useColorGrading } from '../useColorGrading';
import { ColorGradeParams } from '../../types';

describe('useColorGrading', () => {
    it('initializes with default values', () => {
        const { result } = renderHook(() => useColorGrading());
        expect(result.current.color.exposure).toBe(0);
        expect(result.current.color.contrast).toBe(1);
    });

    it('updates color parameters', () => {
        const { result } = renderHook(() => useColorGrading());

        act(() => {
            result.current.handleColorChange('exposure', 0.5);
        });

        expect(result.current.color.exposure).toBe(0.5);
    });

    it('handles undo/redo stack', () => {
        const { result } = renderHook(() => useColorGrading());

        const initialColor = { ...result.current.color };

        // Change 1 (Use setColor to push history)
        act(() => {
            result.current.setColor({ ...initialColor, exposure: 0.5 });
        });
        expect(result.current.color.exposure).toBe(0.5);

        // Change 2
        act(() => {
            result.current.setColor({ ...initialColor, exposure: 0.5, contrast: 1.2 });
        });
        expect(result.current.color.contrast).toBe(1.2);

        // Undo Change 2
        act(() => {
            result.current.undo();
        });
        expect(result.current.color.contrast).toBe(1); // Back to default (from Change 1 state which had default contrast)
        expect(result.current.color.exposure).toBe(0.5); // Still at change 1

        // Undo Change 1
        act(() => {
            result.current.undo();
        });
        expect(result.current.color.exposure).toBe(0); // Back to initial
    });

    it('limits undo stack size', () => {
         const { result } = renderHook(() => useColorGrading());
         const initialColor = { ...result.current.color };

         // Fill stack
         for(let i=0; i<30; i++) {
             act(() => result.current.setColor({ ...initialColor, exposure: i * 0.1 }));
         }

         expect(result.current.canUndo).toBe(true);

         // Undo should work, but we only have 20 items.
         // Current state is i=29 (2.9).
         // 20th item back should be i=9 (0.9) roughly.

         act(() => result.current.undo());
         expect(result.current.color.exposure).toBeCloseTo(28 * 0.1);
    });
});
