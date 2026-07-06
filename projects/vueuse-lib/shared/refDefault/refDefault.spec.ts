import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext, createInjector } from '@cyia/ngx-vueuse/test';
import { refDefault } from './refDefault';

describe('refDefault', () => {
  function testInInjectionContext(fn: () => void) {
    const injector = createInjector();
    runInInjectionContext(injector, fn);
  }

  it('should return default value when source is undefined', () => {
    testInInjectionContext(() => {
      const s = signal<string | undefined>(undefined);
      const result = refDefault(s, 'default');

      expect(result()).toBe('default');
    });
  });

  it('should return source value when source is defined', () => {
    testInInjectionContext(() => {
      const s = signal<string | undefined>('value');
      const result = refDefault(s, 'default');

      expect(result()).toBe('value');
    });
  });

  it('should return default value when source is null', () => {
    testInInjectionContext(() => {
      const s = signal<string | null>(null);
      const result = refDefault(s as any, 'default');

      expect(result()).toBe('default');
    });
  });
});
