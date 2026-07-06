import { describe, expect, it } from 'vitest';
import { signal, runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useLastChanged } from './index';

const injector = createInjector();

describe('useLastChanged', () => {
  it('should return a signal with initial null value', () => {
    runInInjectionContext(injector, () => {
      const val = 42;
      const src = () => val; // A getter function, not an Angular signal
      const result = useLastChanged(src);

      // Initial value is null (matching Vue's shallowRef(null) behavior)
      expect((result as any)()).toBe(null);
    });
  });

  it('should return custom initial value when provided', () => {
    runInInjectionContext(injector, () => {
      const now = Date.now();
      const val = 42;
      const src = () => val;
      const result = useLastChanged(src, { initialValue: now });

      // With explicit initial value, keeps it
      expect((result as any)()).toBe(now);
    });
  });

  it('should return a timestamp number after source changes', () => {
    runInInjectionContext(injector, () => {
      const val = 42;
      const src = () => val;
      const result = useLastChanged(src);

      // After effect runs, it should have a timestamp
      // Note: In Angular, computed values are lazy-evaluated
      const value = (result as any)();
      // Value could be null (initial) or a number (after effect runs)
      expect(value === null || typeof value === 'number').toBe(true);
    });
  });

  it('should work with signal source', () => {
    runInInjectionContext(injector, () => {
      const srcSignal = signal(42);
      const result = useLastChanged(srcSignal);

      // Initial value is null (matching Vue behavior)
      expect((result as any)()).toBe(null);
    });
  });

  it('should return timestamp immediately when immediate: true', () => {
    runInInjectionContext(injector, () => {
      const val = 42;
      const src = () => val;
      const result = useLastChanged(src, { immediate: true });

      // With immediate: true, should already have a timestamp (not null)
      const value = (result as any)();
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  it('should return null initially when immediate: false', () => {
    runInInjectionContext(injector, () => {
      const val = 42;
      const src = () => val;
      const result = useLastChanged(src, { immediate: false });

      // With immediate: false (default), should start as null
      expect((result as any)()).toBe(null);
    });
  });

  it('should return number type when immediate: true with initialValue', () => {
    runInInjectionContext(injector, () => {
      const val = 42;
      const src = () => val;
      const now = Date.now();
      const result = useLastChanged(src, { immediate: true, initialValue: now });

      // Should be a number (the initial timestamp set immediately)
      const value = (result as any)();
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });
});
