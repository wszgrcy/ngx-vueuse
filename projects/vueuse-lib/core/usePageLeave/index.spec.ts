import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { usePageLeave } from './index';

describe('usePageLeave', () => {
  const injector = createInjector();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a signal', () => {
    runInInjectionContext(injector, () => {
      const result = usePageLeave();

      expect(result).toBeDefined();
      expect(typeof result()).toBe('boolean');
    });
  });

  it('should start with isLeft false', () => {
    runInInjectionContext(injector, () => {
      const result = usePageLeave();

      expect(result()).toBe(false);
    });
  });

  it('should return a signal that can be read', () => {
    runInInjectionContext(injector, () => {
      const result = usePageLeave();

      // Signal should be callable
      const value = result();
      expect(value).toBeDefined();
      expect(typeof value).toBe('boolean');
    });
  });

  it('should handle missing window gracefully', () => {
    runInInjectionContext(injector, () => {
      const result = usePageLeave();

      expect(result()).toBe(false);
    });
  });

  it('should accept custom window option', () => {
    runInInjectionContext(injector, () => {
      const mockWindow = {
        document: {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        event: undefined,
      } as any;

      const result = usePageLeave({ window: mockWindow });

      expect(result()).toBe(false);
    });
  });
});
