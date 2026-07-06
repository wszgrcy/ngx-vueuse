import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { computedAsync, asyncComputed } from './index';
import { signal } from '@angular/core';

describe('computedAsync', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.useFakeTimers();
    injector = createInjector();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should export computedAsync and asyncComputed', () => {
    expect(computedAsync).toBeDefined();
    expect(asyncComputed).toBeDefined();
  });

  it('should not be lazy by default', async () => {
    const func = vi.fn(() => Promise.resolve('data'));

    let data: ReturnType<typeof computedAsync<string>>;
    runInInjectionContext(injector, () => {
      data = computedAsync(func);

      expect(func).toBeCalledTimes(1);
      expect(data()).toBeUndefined();
    });

    // Wait for async resolution
    await Promise.resolve();
    await Promise.resolve();

    runInInjectionContext(injector, () => {
      expect(data!()).toBe('data');
    });
  });

  it('should be lazy if configured', async () => {
    const func = vi.fn(async () => 'data');
    let data: ReturnType<typeof computedAsync<string>>;

    runInInjectionContext(injector, () => {
      data = computedAsync(func, undefined, { lazy: true });

      expect(func).not.toBeCalled();
      expect(data()).toBeUndefined();
    });

    // Trigger lazy evaluation by accessing the signal
    runInInjectionContext(injector, () => {
      void data!();
    });

    await Promise.resolve();
    await Promise.resolve();

    runInInjectionContext(injector, () => {
      void data!();
      expect(func).toBeCalledTimes(1);
      expect(data!()).toBe('data');
    });
  });

  it('should call onError when error is thrown', async () => {
    const errorMessage = signal<string | undefined>(undefined);
    const func = vi.fn(async () => {
      throw new Error('An Error Message');
    });

    let data: ReturnType<typeof computedAsync<string>>;
    runInInjectionContext(injector, () => {
      data = computedAsync(func, undefined, {
        onError(e) {
          if (e instanceof Error) errorMessage.set(e.message);
        },
      });

      expect(func).toBeCalledTimes(1);
      expect(data()).toBeUndefined();
    });

    await Promise.resolve();
    await Promise.resolve();

    runInInjectionContext(injector, () => {
      expect(errorMessage()).toBe('An Error Message');
    });
  });

  it('should track evaluating signal', async () => {
    const evaluating = signal(false);
    const func = vi.fn(() => Promise.resolve('data'));

    let data: ReturnType<typeof computedAsync<string>>;
    runInInjectionContext(injector, () => {
      data = computedAsync(func, undefined, { evaluating });

      expect(func).toBeCalledTimes(1);
      expect(data()).toBeUndefined();
    });

    await Promise.resolve();
    await Promise.resolve();

    runInInjectionContext(injector, () => {
      expect(data!()).toBe('data');
      expect(evaluating()).toBe(false);
    });
  });

  it('should use last result (race condition test)', async () => {
    const evaluating = signal(false);
    const resolutions: Array<() => void> = [];
    let runCount = 0;

    let data: ReturnType<typeof computedAsync<string | undefined>>;

    runInInjectionContext(injector, () => {
      data = computedAsync(
        () => {
          runCount++;
          const currentRun = runCount;
          return new Promise((resolve) => {
            resolutions.push(() => resolve(`result-${currentRun}`));
          });
        },
        undefined,
        { evaluating },
      );

      expect(data()).toBeUndefined();
    });

    await Promise.resolve();
    await Promise.resolve();

    runInInjectionContext(injector, () => {
      expect(evaluating()).toBe(true);
      expect(resolutions).toHaveLength(1);
    });

    // Resolve first request
    resolutions[0]();
    await Promise.resolve();
    await Promise.resolve();

    runInInjectionContext(injector, () => {
      expect(data!()).toBe('result-1');
      expect(evaluating()).toBe(false);
    });
  });

  it('should call cancel callback', async () => {
    const onCancel = vi.fn();
    const evaluating = signal(false);
    const currentValue = signal('initial');

    let data: ReturnType<typeof computedAsync<string>>;
    runInInjectionContext(injector, () => {
      data = computedAsync(
        (cancel) => {
          cancel(onCancel);

          const uppercased = currentValue().toUpperCase();

          return new Promise((resolve) => {
            setTimeout(() => resolve(uppercased), 5);
          });
        },
        '',
        { evaluating },
      );

      expect(data()).toBe('');
    });

    // Advance timers to let the async operation complete
    await vi.advanceTimersByTimeAsync(10);

    runInInjectionContext(injector, () => {
      expect(data!()).toBe('INITIAL');
    });

    // Change value - should trigger cancellation
    currentValue.set('to be cancelled');

    await vi.advanceTimersByTimeAsync(10);

    // onCancel should be called because the previous request hasn't finished
    runInInjectionContext(injector, () => {
      expect(onCancel).toBeCalledTimes(1);
    });

    // Change to final value
    currentValue.set('final');

    await vi.advanceTimersByTimeAsync(10);

    runInInjectionContext(injector, () => {
      expect(onCancel).toBeCalledTimes(1);
    });

    await vi.advanceTimersByTimeAsync(10);

    runInInjectionContext(injector, () => {
      expect(data!()).toBe('FINAL');
    });
  });
});
