import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { useToString } from './useToString';

describe('useToString', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should convert number to string', () => {
    testInInjectionContext(() => {
      const s = signal(123);
      const result = useToString(s);
      expect(result()).toBe('123');
    });
  });

  it('should convert object to string', () => {
    testInInjectionContext(() => {
      const s = signal({ a: 1 });
      const result = useToString(s);
      expect(result()).toBe('[object Object]');
    });
  });

  it('should convert null to string', () => {
    testInInjectionContext(() => {
      const s = signal(null);
      const result = useToString(s);
      expect(result()).toBe('null');
    });
  });

  it('should convert undefined to string', () => {
    testInInjectionContext(() => {
      const s = signal(undefined);
      const result = useToString(s);
      expect(result()).toBe('undefined');
    });
  });

  it('should work with plain values', () => {
    testInInjectionContext(() => {
      const result = useToString('hello');
      expect(result()).toBe('hello');
    });
  });
});
