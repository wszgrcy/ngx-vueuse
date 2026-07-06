import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { reactiveComputed } from './reactiveComputed';

describe('reactiveComputed', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should create reactive computed object', () => {
    testInInjectionContext(() => {
      const count = signal(0);
      const doubled = signal(2);

      const obj = reactiveComputed(() => ({
        count: count(),
        doubled: doubled(),
        sum: count() + doubled(),
      }));

      expect(obj.count).toBe(0);
      expect(obj.doubled).toBe(2);
      expect(obj.sum).toBe(2);
    });
  });

  it('should be reactive', () => {
    testInInjectionContext(() => {
      const count = signal(0);

      const obj = reactiveComputed(() => ({
        count: count(),
      }));

      expect(obj.count).toBe(0);

      count.set(5);
      expect(obj.count).toBe(5);
    });
  });
});
