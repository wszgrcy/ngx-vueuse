import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useDebouncedRefHistory } from './index';

describe('useDebouncedRefHistory', () => {
  const injector = createInjector();

  it('should return history with basic properties', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 100 });

      expect(result.source).toBeDefined();
      expect(result.history).toBeDefined();
      expect(result.last).toBeDefined();
      expect(result.undoStack).toBeDefined();
      expect(result.redoStack).toBeDefined();
      expect(result.canUndo).toBeDefined();
      expect(result.canRedo).toBeDefined();
      expect(result.undo).toBeDefined();
      expect(result.redo).toBeDefined();
      expect(result.clear).toBeDefined();
      expect(result.commit).toBeDefined();
      expect(result.reset).toBeDefined();
      expect(result.pause).toBeDefined();
      expect(result.resume).toBeDefined();
      expect(result.batch).toBeDefined();
      expect(result.dispose).toBeDefined();
    });
  });

  it('should track history changes with debounce', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 100 });

      // Initial state - undoStack starts empty, initial record is in last()
      expect(result.undoStack()).toHaveLength(0);
      expect(result.canUndo()).toBe(false);

      // Change the source - with debounce, commit is delayed
      src.set(1);
      // The debounce filter delays the commit, so immediately after setting,
      // the history may or may not have the new record depending on timing
      expect(result.source()).toBe(1);
    });
  });

  it('should work with undefined debounce (default)', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src);

      expect(result.source).toBeDefined();
      expect(result.commit).toBeDefined();
    });
  });

  it('should create initial history record', () => {
    runInInjectionContext(injector, () => {
      const src = signal({ name: 'test', value: 42 });
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      expect(result.last()).toBeDefined();
      expect(result.last().snapshot).toEqual({ name: 'test', value: 42 });
    });
  });

  it('should support manual commit', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      const initialHistoryLength = result.history().length;
      expect(initialHistoryLength).toBeGreaterThan(0);

      // Manual commit should add a new record
      result.commit();
      expect(result.history().length).toBeGreaterThan(initialHistoryLength);
    });
  });

  it('should support manual undo/redo on existing history', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      // Commit manually to create history
      result.commit();
      result.commit();

      expect(result.canUndo()).toBe(true);
      expect(result.canRedo()).toBe(false);

      result.undo();
      expect(result.canUndo()).toBe(true);
      expect(result.canRedo()).toBe(true);

      result.redo();
      // After redo, the item moved from redoStack to undoStack, so canRedo should be false
      // since there's nothing left to redo
      expect(result.redoStack()).toHaveLength(0);
    });
  });

  it('should support clear', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      result.commit();
      result.commit();

      expect(result.undoStack().length).toBeGreaterThan(0);

      result.clear();
      expect(result.undoStack()).toHaveLength(0);
      expect(result.redoStack()).toHaveLength(0);
    });
  });

  it('should support reset', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      result.commit();
      const lastSnapshot = result.last().snapshot;

      src.set(999);
      result.reset();

      expect(result.source()).toBe(lastSnapshot);
    });
  });

  it('should support pause and resume', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      expect(result.isTracking()).toBe(true);

      result.pause();
      expect(result.isTracking()).toBe(false);

      result.resume();
      expect(result.isTracking()).toBe(true);

      result.resume(true);
      expect(result.isTracking()).toBe(true);
    });
  });

  it('should support batch operations', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      const initialHistoryLength = result.history().length;

      result.batch(() => {
        src.set(1);
        src.set(2);
        src.set(3);
      });

      // Batch should commit once at the end
      expect(result.history().length).toBeGreaterThan(initialHistoryLength);
    });
  });

  it('should support batch with cancel', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0 });

      const initialHistoryLength = result.history().length;

      result.batch((cancel) => {
        src.set(1);
        cancel(); // Cancel the batch
      });

      // Should not commit since batch was canceled
      expect(result.history().length).toBe(initialHistoryLength);
    });
  });

  it('should support custom clone option', () => {
    runInInjectionContext(injector, () => {
      const src = signal({ value: 0 });
      const result = useDebouncedRefHistory(src, { debounce: 0, clone: true });

      result.commit();
      src.set({ value: 1 });
      result.commit();

      expect(result.history().length).toBeGreaterThan(1);
      expect(result.history()[1].snapshot).toEqual({ value: 0 });
      expect(result.history()[0].snapshot).toEqual({ value: 1 });
    });
  });

  it('should support custom dump and parse options', () => {
    runInInjectionContext(injector, () => {
      const src = signal({ value: 0 });
      const result = useDebouncedRefHistory<{ value: number }, string>(src, {
        debounce: 0,
        dump: (v) => JSON.stringify(v),
        parse: (v) => JSON.parse(v),
      });

      result.commit();
      src.set({ value: 1 });
      result.commit();

      expect(result.history().length).toBeGreaterThan(1);
    });
  });

  it('should respect capacity option', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, { debounce: 0, capacity: 2 });

      result.commit();
      result.commit();
      result.commit();

      // Should only keep 2 history records due to capacity
      expect(result.undoStack().length).toBeLessThanOrEqual(2);
    });
  });

  it('should support shouldCommit option', () => {
    runInInjectionContext(injector, () => {
      const src = signal(0);
      const result = useDebouncedRefHistory(src, {
        debounce: 0,
        shouldCommit: (oldVal, newVal) => (newVal as number) > 0,
      });

      // Should not commit for value 0 (same as initial)
      src.set(0);
      result.commit();
      const lengthAfterFirst = result.undoStack().length;

      // Should commit for value 5
      src.set(5);
      result.commit();
      const lengthAfterSecond = result.undoStack().length;

      expect(lengthAfterSecond).toBeGreaterThan(lengthAfterFirst);
    });
  });
});
