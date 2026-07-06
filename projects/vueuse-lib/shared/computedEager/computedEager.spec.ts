import { describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { computedEager } from './computedEager';

describe('computedEager', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should create a computed eager signal', () => {
    testInInjectionContext(() => {
      const count = signal(0);
      const result = computedEager(() => count() * 2);

      expect(result()).toBe(0);
    });
  });

  it('should call the function immediately', () => {
    testInInjectionContext(() => {
      const fn = vi.fn(() => 42);
      const result = computedEager(fn);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result()).toBe(42);
    });
  });
});
