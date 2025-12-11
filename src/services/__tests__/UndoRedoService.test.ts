import { describe, it, expect, beforeEach } from 'vitest';
import { UndoRedoService } from '../UndoRedoService';

describe('UndoRedoService', () => {
  let service: UndoRedoService;

  beforeEach(() => {
    service = new UndoRedoService();
  });

  describe('recordAction', () => {
    it('should record an action', () => {
      service.recordAction({
        type: 'color-change',
        previousState: { hue: 0 },
        newState: { hue: 180 },
        description: 'Change hue'
      });

      expect(service.canUndo()).toBe(true);
      expect(service.getUndoDescription()).toBe('Change hue');
    });

    it('should clear redo stack when new action is recorded', () => {
      // Record and undo an action
      service.recordAction({
        type: 'test',
        previousState: {},
        newState: {},
        description: 'Test 1'
      });
      service.undo();
      expect(service.canRedo()).toBe(true);

      // Record new action
      service.recordAction({
        type: 'test',
        previousState: {},
        newState: {},
        description: 'Test 2'
      });

      expect(service.canRedo()).toBe(false);
    });
  });

  describe('undo/redo', () => {
    it('should undo and redo actions correctly', () => {
      const action = {
        type: 'test',
        previousState: { value: 1 },
        newState: { value: 2 },
        description: 'Test action'
      };

      service.recordAction(action);
      
      const undoneAction = service.undo();
      expect(undoneAction?.type).toBe('test');
      expect(service.canUndo()).toBe(false);
      expect(service.canRedo()).toBe(true);

      const redoneAction = service.redo();
      expect(redoneAction?.type).toBe('test');
      expect(service.canUndo()).toBe(true);
      expect(service.canRedo()).toBe(false);
    });

    it('should return null when nothing to undo/redo', () => {
      expect(service.undo()).toBe(null);
      expect(service.redo()).toBe(null);
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      service.recordAction({
        type: 'test',
        previousState: {},
        newState: {},
        description: 'Test'
      });

      service.clear();
      expect(service.canUndo()).toBe(false);
      expect(service.canRedo()).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on changes', () => {
      let notified = false;
      const unsubscribe = service.subscribe(() => {
        notified = true;
      });

      service.recordAction({
        type: 'test',
        previousState: {},
        newState: {},
        description: 'Test'
      });

      expect(notified).toBe(true);
      unsubscribe();
    });
  });
});
