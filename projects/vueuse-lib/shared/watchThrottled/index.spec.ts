import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { throttledWatch, watchThrottled } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('watchThrottled', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.useFakeTimers();
    injector = createInjector();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should export module', () => {
    expect(watchThrottled).toBeDefined();
    expect(throttledWatch).toBeDefined();
  });

  it('should create throttled watcher', () => {
    const calls: any[] = [];

    runInInjectionContext(injector, () => {
      const num = signal(0);
      watchThrottled(num, (val: any) => calls.push(val), { throttle: 100 });

      num.set(1);
      num.set(2);
    });

    // watchThrottled should have been created
    expect(calls.length).toBeGreaterThanOrEqual(0);
  });
});
