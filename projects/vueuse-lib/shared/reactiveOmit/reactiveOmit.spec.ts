import { describe, expect, it } from 'vitest';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { reactiveOmit } from './reactiveOmit';

describe('reactiveOmit', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should omit specified keys', () => {
    testInInjectionContext(() => {
      const obj = {
        a: 1,
        b: 2,
        c: 3,
      };
      const result = reactiveOmit(obj, 'a', 'c');

      expect((result as any).a).toBeUndefined();
      expect(result.b).toBe(2);
      expect((result as any).c).toBeUndefined();
    });
  });

  it('should omit using predicate', () => {
    testInInjectionContext(() => {
      const obj = {
        a: 1,
        b: 2,
        c: 3,
      };
      const result = reactiveOmit(obj, (value) => value > 1);

      expect(result.a).toBe(1);
      expect(result.b).toBeUndefined();
      expect(result.c).toBeUndefined();
    });
  });
});
