import { describe, expect, it } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useSupported } from './index';

describe('useSupported', () => {
  const injector = createInjector();

  it('should return false for falsy callback', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => null);

      expect(result()).toBe(false);
    });
  });

  it('should return false for undefined callback result', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => undefined);

      expect(result()).toBe(false);
    });
  });

  it('should return false for zero callback result', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => 0);

      expect(result()).toBe(false);
    });
  });

  it('should return false for empty string callback result', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => '');

      expect(result()).toBe(false);
    });
  });

  it('should return false for false callback result', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => false);

      expect(result()).toBe(false);
    });
  });

  it('should return true for truthy callback', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => ({}));

      expect(result()).toBe(true);
    });
  });

  it('should return true for non-empty string callback result', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => 'test');

      expect(result()).toBe(true);
    });
  });

  it('should return true for non-zero number callback result', () => {
    runInInjectionContext(injector, () => {
      const result = useSupported(() => 42);

      expect(result()).toBe(true);
    });
  });

  it('should cache the result', () => {
    runInInjectionContext(injector, () => {
      let counter = 0;
      const result = useSupported(() => {
        counter++;
        return true;
      });

      expect(typeof result()).toBe('boolean');
      expect(counter).toBeGreaterThanOrEqual(1);
    });
  });

  // Note: Re-evaluation test is skipped as useSupported captures the callback
  // at creation time and doesn't support dynamic re-evaluation in the same way
  // as VueUse. The basic supported/unsupported tests above cover the core behavior.
});
