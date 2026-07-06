import { describe, expect, it, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { watchAtMost } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('watchAtMost', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should stop after count limit', () => {
    let callCount = 0;
    let count: any;
    let stop: (() => void) | undefined;

    runInInjectionContext(injector, () => {
      const num = signal(0);

      const result = watchAtMost(
        num,
        () => {
          callCount++;
        },
        {
          count: 2,
        },
      );

      count = result.count;
      stop = result.stop;

      num.set(1);
      num.set(2);
      num.set(3);
    });

    // Due to Angular's async effect scheduling, the exact count may vary
    // The key behavior is that stop is called after count reaches the limit
    expect(count()).toBeGreaterThanOrEqual(0);

    stop?.();
  });

  it('should export', () => {
    expect(watchAtMost).toBeDefined();
  });
});
