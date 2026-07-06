import { describe, expect, it } from 'vitest';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { reactifyObject } from './reactifyObject';

describe('reactifyObject', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should reactify all methods in object', () => {
    testInInjectionContext(() => {
      const obj = {
        a: 1,
        add(x: number, y: number) {
          return x + y;
        },
      };
      const reactified = reactifyObject(obj);

      expect(reactified.a).toBe(1);
      expect((reactified.add as any)(1, 2)()).toBe(3);
    });
  });

  it('should reactify specific keys', () => {
    testInInjectionContext(() => {
      const obj = {
        add(x: number, y: number) {
          return x + y;
        },
      };
      const reactified = reactifyObject(obj, ['add']);

      expect((reactified.add as any)(2, 3)()).toBe(5);
    });
  });
});
