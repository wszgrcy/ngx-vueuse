import { describe, expect, it } from 'vitest';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { reactivePick } from './reactivePick';

describe('reactivePick', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should pick specified keys', () => {
    testInInjectionContext(() => {
      const obj = {
        a: 1,
        b: 2,
        c: 3,
      };
      const result = reactivePick(obj, 'a', 'c');

      // result.a and result.c are signals, so we need to call them
      expect((result as any).a()).toBe(1);
      expect((result as any).b).toBeUndefined();
      expect((result as any).c()).toBe(3);
    });
  });

  it('should pick using predicate', () => {
    testInInjectionContext(() => {
      const obj = {
        a: 1,
        b: 2,
        c: 3,
      };
      const result = reactivePick(obj, (value) => value > 1);

      expect((result as any).a).toBeUndefined();
      expect((result as any).b).toBe(2);
      expect((result as any).c).toBe(3);
    });
  });
});
