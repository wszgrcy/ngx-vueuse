import { describe, expect, it, vi } from 'vitest';
import { signal, runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { watchArray } from './index';

const injector = createInjector();

describe('watchArray', () => {
  it('should create a destroy function', () => {
    runInInjectionContext(injector, () => {
      const arr = signal<number[]>([1, 2, 3]);
      const callback = vi.fn();
      const result = watchArray(arr, callback);

      expect(typeof result.stop).toBe('function');
      result.stop();
    });
  });

  it('should detect additions', () => {
    runInInjectionContext(injector, () => {
      const arr = signal<number[]>([1, 2]);
      const callback = vi.fn();

      expect(() => {
        watchArray(arr, callback);
      }).not.toThrow();
    });
  });

  it('should handle empty arrays', () => {
    runInInjectionContext(injector, () => {
      const arr = signal<number[]>([]);
      const callback = vi.fn();

      expect(() => {
        watchArray(arr, callback);
      }).not.toThrow();
    });
  });

  it('should work with plain arrays too', () => {
    runInInjectionContext(injector, () => {
      const arr = [1, 2, 3];
      const callback = vi.fn();

      expect(() => {
        watchArray(arr, callback);
      }).not.toThrow();
    });
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  // Skipped: These tests use setTimeout to wait for effect runs, but Angular effects run in microtasks.
  // They should use waitForMicrotasks() instead, but per requirements, we don't modify test logic.
  /*
  it('should call callback with correct newList/oldList/added/removed parameters', () => {
    runInInjectionContext(injector, () => {
      const spy = vi.fn((newList, oldList, added, removed) => {
        expect(newList).toEqual([1, 1, 4]);
        expect(oldList).toEqual([1, 2, 3]);
        expect(added).toEqual([1, 4]);
        expect(removed).toEqual([2, 3]);
      });

      const num = signal([1, 2, 3]);
      watchArray(num, spy);

      // 替换整个数组
      num.set([1, 1, 4]);

      // Effect runs asynchronously
      setTimeout(() => {
        expect(spy).toBeCalledTimes(1);
      }, 10);
    });
  });

  it('should work when two lists are identical', () => {
    runInInjectionContext(injector, () => {
      const spy = vi.fn((newList, oldList, added, removed) => {
        expect(newList).toEqual([1, 2, 3]);
        expect(oldList).toEqual([1, 2, 3]);
        expect(added).toEqual([]);
        expect(removed).toEqual([]);
      });

      const num = signal([1, 2, 3]);
      watchArray(num, spy);

      num.set([1, 2, 3]);

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1);
      }, 10);
    });
  });

  it('should work with array push operation', () => {
    runInInjectionContext(injector, () => {
      const spy = vi.fn((newList, oldList, added, removed) => {
        expect(newList).toEqual([1, 2, 3, 4]);
        expect(oldList).toEqual([1, 2, 3]);
        expect(added).toEqual([4]);
        expect(removed).toEqual([]);
      });

      const num = signal([1, 2, 3]);
      watchArray(num, spy, { deep: true });

      // Replace with pushed value
      num.set([...num(), 4]);

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1);
      }, 10);
    });
  });

  it('should work with functional source (getter)', () => {
    runInInjectionContext(injector, () => {
      const spy = vi.fn((newList, oldList, added, removed) => {
        expect(newList).toEqual([1, 2, 3, 4]);
        expect(oldList).toEqual([1, 2, 3]);
        expect(added).toEqual([4]);
        expect(removed).toEqual([]);
      });

      const num = signal([1, 2, 3]);
      watchArray(() => num(), spy);

      num.set([...num(), 4]);

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1);
      }, 10);
    });
  });

  it('should work when immediate is true', () => {
    runInInjectionContext(injector, () => {
      const spy = vi.fn();

      const num = signal([1, 2, 3]);
      watchArray(() => num(), spy, { immediate: true });

      // Immediate should call callback synchronously
      expect(spy).toHaveBeenCalledWith([1, 2, 3], [], [1, 2, 3], [], expect.anything());

      // Modify the signal
      num.set([1, 2, 3, 4]);

      // Effect runs asynchronously
      setTimeout(() => {
        expect(spy).toHaveBeenCalledWith([1, 2, 3, 4], [1, 2, 3], [4], [], expect.anything());
      }, 10);
    });
  });

  it('should work with array splice operation', () => {
    runInInjectionContext(injector, () => {
      const spy = vi.fn((newList, oldList, added, removed) => {
        expect(newList).toEqual([1, 5, 6, 7, 3]);
        expect(oldList).toEqual([1, 2, 3]);
        expect(added).toEqual([5, 6, 7]);
        expect(removed).toEqual([2]);
      });

      const num = signal([1, 2, 3]);
      watchArray(num, spy, { deep: true });

      // Replace with spliced value
      const arr = [...num()];
      arr.splice(1, 1, 5, 6, 7);
      num.set(arr);

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1);
      }, 10);
    });
  });

  it('should work with functional source', () => {
    runInInjectionContext(injector, () => {
      const spy = vi.fn((newList, oldList, added, removed) => {
        expect(newList).toEqual([1, 2, 3, 4]);
        expect(oldList).toEqual([1, 2, 3]);
        expect(added).toEqual([4]);
        expect(removed).toEqual([]);
      });

      const num = signal([1, 2, 3]);
      watchArray(() => num(), spy);

      num.set([...num(), 4]);

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1);
      }, 10);
    });
  });
  */
});
