/**
 * Undo/Redo service for color grading operations
 * Tracks state changes and allows reverting to previous states
 */

export interface UndoableAction {
  type: string;
  timestamp: number;
  previousState: any;
  newState: any;
  description: string;
}

export class UndoRedoService {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];
  private maxHistorySize = 50;
  private listeners: Array<() => void> = [];

  /**
   * Record a new action
   */
  recordAction(action: Omit<UndoableAction, 'timestamp'>): void {
    const fullAction: UndoableAction = {
      ...action,
      timestamp: Date.now()
    };

    // Add to undo stack
    this.undoStack.push(fullAction);

    // Clear redo stack when new action is recorded
    this.redoStack = [];

    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift();
    }

    this.notifyListeners();
  }

  /**
   * Undo the last action
   */
  undo(): UndoableAction | null {
    const action = this.undoStack.pop();
    if (!action) return null;

    // Move to redo stack
    this.redoStack.push(action);

    this.notifyListeners();
    return action;
  }

  /**
   * Redo the last undone action
   */
  redo(): UndoableAction | null {
    const action = this.redoStack.pop();
    if (!action) return null;

    // Move back to undo stack
    this.undoStack.push(action);

    this.notifyListeners();
    return action;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get the description of the next undo action
   */
  getUndoDescription(): string | null {
    const action = this.undoStack[this.undoStack.length - 1];
    return action ? action.description : null;
  }

  /**
   * Get the description of the next redo action
   */
  getRedoDescription(): string | null {
    const action = this.redoStack[this.redoStack.length - 1];
    return action ? action.description : null;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current state for debugging
   */
  getState() {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoDescription: this.getUndoDescription(),
      redoDescription: this.getRedoDescription()
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Export singleton instance
export const undoRedoService = new UndoRedoService();
