import { describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { createInjector, runInInjectionContext as ric } from '@cyia/ngx-vueuse/test';
import { useManualRefHistory } from './index';

describe('useManualRefHistory', () => {
  const injector = createInjector();

  it('should return an object with all expected properties', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      expect(result.source).toBeDefined();
      expect(result.history).toBeDefined();
      expect(result.last).toBeDefined();
      expect(result.undoStack).toBeDefined();
      expect(result.redoStack).toBeDefined();
      expect(result.canUndo).toBeDefined();
      expect(result.canRedo).toBeDefined();
      expect(result.clear).toBeDefined();
      expect(result.commit).toBeDefined();
      expect(result.reset).toBeDefined();
      expect(result.undo).toBeDefined();
      expect(result.redo).toBeDefined();
    });
  });

  it('should create initial history record', () => {
    ric(injector, () => {
      const src = signal({ name: 'test', value: 42 });
      const result = useManualRefHistory(src);

      expect(result.last()).toBeDefined();
      expect(result.last().snapshot).toEqual({ name: 'test', value: 42 });
      expect(result.last().timestamp).toBeDefined();
    });
  });

  it('should start with empty undo/redo stacks', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      expect(result.undoStack()).toHaveLength(0);
      expect(result.redoStack()).toHaveLength(0);
      expect(result.canUndo()).toBe(false);
      expect(result.canRedo()).toBe(false);
    });
  });

  it('should create a new history record on commit', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      src.set(1);
      result.commit();

      expect(result.undoStack()).toHaveLength(1);
      expect(result.canUndo()).toBe(true);
      expect(result.last().snapshot).toBe(1);
    });
  });

  it('should clear redo stack on commit', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      src.set(1);
      result.commit();
      src.set(2);
      result.commit();

      expect(result.undoStack()).toHaveLength(2);
      expect(result.redoStack()).toHaveLength(0);

      // Undo once
      result.undo();
      expect(result.canRedo()).toBe(true);

      // Commit should clear redo stack
      src.set(3);
      result.commit();
      expect(result.redoStack()).toHaveLength(0);
    });
  });

  it('should support undo', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      src.set(1);
      result.commit();
      src.set(2);
      result.commit();

      expect(result.source()).toBe(2);
      result.undo();
      expect(result.source()).toBe(1);
    });
  });

  it('should support redo', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      src.set(1);
      result.commit();
      src.set(2);
      result.commit();

      result.undo();
      expect(result.source()).toBe(1);

      result.redo();
      expect(result.source()).toBe(2);
    });
  });

  it('should support multiple undo/redo', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      for (let i = 1; i <= 5; i++) {
        src.set(i);
        result.commit();
      }

      expect(result.undoStack()).toHaveLength(5);

      result.undo();
      result.undo();
      expect(result.source()).toBe(3);

      result.redo();
      result.redo();
      expect(result.source()).toBe(5);
    });
  });

  it('should clear all history', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      src.set(1);
      result.commit();
      src.set(2);
      result.commit();

      expect(result.undoStack()).toHaveLength(2);

      result.clear();

      expect(result.undoStack()).toHaveLength(0);
      expect(result.redoStack()).toHaveLength(0);
      expect(result.canUndo()).toBe(false);
      expect(result.canRedo()).toBe(false);
    });
  });

  it('should reset source to last history value', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      src.set(1);
      result.commit();
      src.set(2);
      result.commit();
      src.set(3);

      expect(result.source()).toBe(3);
      result.reset();
      expect(result.source()).toBe(2);
    });
  });

  it('should compute history as [last, ...undoStack]', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      // Initial: last = 0, undoStack = []
      expect(result.last().snapshot).toBe(0);
      expect(result.undoStack()).toHaveLength(0);

      src.set(1);
      result.commit();
      // After commit: undoStack = [0], last = 1
      expect(result.undoStack()).toHaveLength(1);
      expect(result.undoStack()[0].snapshot).toBe(0);
      expect(result.last().snapshot).toBe(1);

      src.set(2);
      result.commit();
      // After second commit: undoStack = [1, 0], last = 2
      expect(result.undoStack()).toHaveLength(2);
      expect(result.undoStack()[0].snapshot).toBe(1);
      expect(result.undoStack()[1].snapshot).toBe(0);
      expect(result.last().snapshot).toBe(2);

      const history = result.history();
      expect(history).toHaveLength(3); // last + 2 undo entries
      expect(history[0].snapshot).toBe(2); // current last
      expect(history[1].snapshot).toBe(1); // most recent undo
      expect(history[2].snapshot).toBe(0); // oldest undo
    });
  });

  it('should respect capacity limit', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src, { capacity: 3 });

      for (let i = 1; i <= 5; i++) {
        src.set(i);
        result.commit();
      }

      // Trace through:
      // commit 1 (src=1): undo=[0], last=1
      // commit 2 (src=2): undo=[1,0], last=2
      // commit 3 (src=3): undo=[2,1,0], last=3 (length=3, at capacity)
      // commit 4 (src=4): undo=[3,2,1], last=4 (spliced to capacity 3, removed 0)
      // commit 5 (src=5): undo=[4,3,2], last=5 (spliced to capacity 3, removed 1)
      expect(result.undoStack()).toHaveLength(3);
      expect(result.undoStack()[0].snapshot).toBe(4); // most recent (previous last before commit 5)
      expect(result.undoStack()[1].snapshot).toBe(3);
      expect(result.undoStack()[2].snapshot).toBe(2); // oldest kept
    });
  });

  it('should support custom clone function', () => {
    ric(injector, () => {
      const src = signal({ value: 0 });
      const cloneFn = vi.fn((x: any) => ({ ...x }));
      const result = useManualRefHistory(src, { clone: cloneFn });

      src.set({ value: 1 });
      result.commit();

      expect(cloneFn).toHaveBeenCalledWith({ value: 1 });
      expect(result.last().snapshot).toEqual({ value: 1 });
    });
  });

  it('should support JSON clone when clone is true', () => {
    ric(injector, () => {
      const src = signal({ value: 0 });
      const result = useManualRefHistory(src, { clone: true });

      src.set({ value: 1 });
      result.commit();

      expect(result.last().snapshot).toEqual({ value: 1 });
    });
  });

  it('should support custom dump/parse functions', () => {
    ric(injector, () => {
      const src = signal({ value: 0 });
      const dump = vi.fn((x: any) => JSON.stringify(x));
      const parse = vi.fn((x: string) => JSON.parse(x));
      const result = useManualRefHistory(src, { dump, parse });

      // dump is called during initial record creation
      expect(dump).toHaveBeenCalledWith({ value: 0 });

      src.set({ value: 1 });
      result.commit();

      // dump is called again when creating new history record in commit
      expect(dump).toHaveBeenLastCalledWith({ value: 1 });
      // parse is not called during commit, only during undo/redo/reset via _setSource
    });
  });

  it('should support custom setSource function', () => {
    ric(injector, () => {
      const src = signal(0);
      const customSetSource = vi.fn((source: any, value: number) => source.set(value));
      const result = useManualRefHistory(src, { setSource: customSetSource });

      src.set(1);
      result.commit();
      src.set(2);
      result.commit();

      expect(customSetSource).toHaveBeenCalledTimes(0); // setSource only called during undo/redo/reset

      result.undo();

      // setSource is called once during undo to restore the source value
      expect(customSetSource).toHaveBeenCalledTimes(1);
      expect(customSetSource).toHaveBeenCalledWith(src, 1);
    });
  });

  it('should handle undo when undo stack is empty', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      result.undo(); // should not throw

      expect(result.source()).toBe(0);
      expect(result.canRedo()).toBe(false);
    });
  });

  it('should handle redo when redo stack is empty', () => {
    ric(injector, () => {
      const src = signal(0);
      const result = useManualRefHistory(src);

      result.redo(); // should not throw

      expect(result.source()).toBe(0);
      expect(result.canUndo()).toBe(false);
    });
  });

  it('should handle objects with circular-like structures via JSON clone', () => {
    ric(injector, () => {
      const src = signal({ nested: { value: 1 } });
      const result = useManualRefHistory(src, { clone: true });

      src.set({ nested: { value: 2 } });
      result.commit();

      // Modify original should not affect history
      src.set({ nested: { value: 3 } });

      expect(result.last().snapshot).toEqual({ nested: { value: 2 } });
    });
  });

  it('should handle array values', () => {
    ric(injector, () => {
      const src = signal([1, 2, 3]);
      const result = useManualRefHistory(src, { clone: true });

      src.set([4, 5, 6]);
      result.commit();

      expect(result.last().snapshot).toEqual([4, 5, 6]);

      result.undo();
      expect(result.source()).toEqual([1, 2, 3]);
    });
  });

  it('should handle null/undefined values', () => {
    ric(injector, () => {
      const src = signal<string | null>(null);
      const result = useManualRefHistory(src);

      src.set('test');
      result.commit();

      expect(result.last().snapshot).toBe('test');

      result.undo();
      expect(result.source()).toBeNull();
    });
  });
});
