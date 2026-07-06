import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { reactify, createReactiveFn } from './reactify';

describe('reactify', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should convert function to reactive function', () => {
    testInInjectionContext(() => {
      const add = (a: number, b: number) => a + b;
      const reactifiedAdd = reactify(add);

      const result = reactifiedAdd(1, 2);
      expect(result()).toBe(3);
    });
  });

  it('should work with signal arguments', () => {
    testInInjectionContext(() => {
      const add = (a: number, b: number) => a + b;
      const reactifiedAdd = reactify(add);

      const s1 = signal(1);
      const s2 = signal(2);
      const result = reactifiedAdd(s1, s2);
      expect(result()).toBe(3);
    });
  });

  it('should be deprecated alias createReactiveFn', () => {
    expect(createReactiveFn).toBe(reactify);
  });
});
