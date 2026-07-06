import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { useToNumber } from './useToNumber';

describe('useToNumber', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should convert string to number', () => {
    testInInjectionContext(() => {
      const s = signal('123');
      const result = useToNumber(s);
      expect(result()).toBe(123);
    });
  });

  it('should use parseFloat by default', () => {
    testInInjectionContext(() => {
      const s = signal('123.456');
      const result = useToNumber(s);
      expect(result()).toBe(123.456);
    });
  });

  it('should use parseInt with radix', () => {
    testInInjectionContext(() => {
      const s = signal('1010');
      const result = useToNumber(s, { method: 'parseInt', radix: 2 });
      expect(result()).toBe(10);
    });
  });

  it('should replace NaN with zero when nanToZero is true', () => {
    testInInjectionContext(() => {
      const s = signal('not a number');
      const result = useToNumber(s, { nanToZero: true });
      expect(result()).toBe(0);
    });
  });

  it('should return number as is', () => {
    testInInjectionContext(() => {
      const s = signal(42);
      const result = useToNumber(s);
      expect(result()).toBe(42);
    });
  });
});
