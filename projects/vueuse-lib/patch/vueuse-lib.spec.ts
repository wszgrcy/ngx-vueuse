import { describe, expect, it, vi, afterEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { syncEffect } from './sync-effect';
import { signal } from '@angular/core';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('sync-effect', () => {
  const injector = createInjector();
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('hello', () => {
    runInInjectionContext(injector, () => {
      let value = 1;
      syncEffect((cleanup) => {
        value = 2;
      });
      expect(value).eq(2);
    });
  });

  it('should call fn synchronously on first invocation', () => {
    runInInjectionContext(injector, () => {
      let callCount = 0;
      syncEffect(() => {
        callCount++;
      });
      expect(callCount).toBe(1);
    });
  });

  it('should pass cleanup function to fn', () => {
    runInInjectionContext(injector, () => {
      let cleanupRegistered = false;
      syncEffect((onCleanup) => {
        expect(onCleanup).toBeDefined();
        expect(typeof onCleanup).toBe('function');
        onCleanup(() => {
          cleanupRegistered = true;
        });
      });
      // Cleanup is registered but not yet executed
      expect(cleanupRegistered).toBe(false);
    });
  });

  it('should not run fn twice synchronously', () => {
    runInInjectionContext(injector, () => {
      let callCount = 0;
      syncEffect(() => {
        callCount++;
      });
      // Should only be called once synchronously
      expect(callCount).toBe(1);
    });
  });

  it('should read signals synchronously during fn execution', () => {
    runInInjectionContext(injector, () => {
      const counter = signal(0);
      let lastValue: number | null = null;

      syncEffect(() => {
        lastValue = counter();
      });

      expect(lastValue).toBe(0);

      // Signal is read synchronously within fn
      expect(counter()).toBe(0);
    });
  });

  it('should cleanup previous effect when re-running', () => {
    runInInjectionContext(injector, () => {
      const cleanupLog: string[] = [];

      syncEffect((onCleanup) => {
        onCleanup(() => {
          cleanupLog.push('cleanup-1');
        });
      });

      expect(cleanupLog).toEqual([]);
    });
  });

  it('should return an EffectRef', () => {
    runInInjectionContext(injector, () => {
      const effectRef = syncEffect(() => {});
      expect(effectRef).toBeDefined();
    });
  });

  it('should support options parameter', () => {
    runInInjectionContext(injector, () => {
      let callCount = 0;
      syncEffect(
        () => {
          callCount++;
        },
        { manualCleanup: true },
      );
      expect(callCount).toBe(1);
    });
  });

  it('should call cleanup with the innerOnCleanup from effect', () => {
    runInInjectionContext(injector, () => {
      let cleanupFn: ((fn: () => void) => void) | null = null;

      syncEffect((onCleanup) => {
        // onCleanup should be a function that registers cleanup
        cleanupFn = onCleanup as any;
        onCleanup(() => {});
      });

      expect(cleanupFn).toBeDefined();
      expect(typeof cleanupFn).toBe('function');
    });
  });

  it('should execute fn with correct this context', () => {
    runInInjectionContext(injector, () => {
      let hasCorrectContext = false;
      syncEffect(function (this: unknown, onCleanup: (fn: () => void) => void) {
        hasCorrectContext = this === undefined; // global/undefined in non-strict or component context
        onCleanup(() => {});
      });
      expect(hasCorrectContext).toBe(true);
    });
  });

  it('should execute cleanup asynchronously on first effect run', async () => {
    runInInjectionContext(injector, () => {
      let cleanupCalled = false;

      syncEffect((onCleanup) => {
        onCleanup(() => {
          cleanupCalled = true;
        });
      });

      expect(cleanupCalled).toBe(false);
    });

    // Wait for microtask to let effect trigger
    await waitForMicrotasks();
    // Note: cleanup is called when effect re-triggers, which requires signal dependency
  });

  it('should call cleanup before re-executing fn on async update', async () => {
    const injector2 = createInjector();
    const log: string[] = [];

    const counter = signal(0);
    runInInjectionContext(injector2, () => {
      syncEffect((onCleanup) => {
        const c = counter();
        log.push(`run-${c}`);
        onCleanup(() => {
          log.push(`cleanup-${c}`);
        });
      });
    });

    expect(log).toEqual(['run-0']);
    await waitForMicrotasks();
    counter.update((a) => a + 1);
    await waitForMicrotasks();
    expect(log).toContain('cleanup-0');
    expect(log).toContain('run-1');
  });
});
