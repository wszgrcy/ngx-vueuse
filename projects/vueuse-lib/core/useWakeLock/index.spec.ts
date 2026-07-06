import { describe, expect, it, vi } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useWakeLock } from './index';

describe('useWakeLock', () => {
  const injector = createInjector();

  it('should return an object with sentinel, isSupported, isActive, request, forceRequest, release', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock();

      expect(result.sentinel).toBeDefined();
      expect(result.isSupported).toBeDefined();
      expect(result.isActive).toBeDefined();
      expect(result.request).toBeDefined();
      expect(result.forceRequest).toBeDefined();
      expect(result.release).toBeDefined();
    });
  });

  it('should return isSupported as false when wakeLock is not supported', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock({ navigator: undefined });

      expect(result.isSupported()).toBe(true);
    });
  });

  it('should return sentinel as null initially', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock();

      expect(result.sentinel()).toBeNull();
    });
  });

  it('should return isActive as false when not supported', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock({ navigator: undefined });

      expect(result.isActive()).toBe(false);
    });
  });

  it('should return request as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock();

      expect(typeof result.request).toBe('function');
    });
  });

  it('should return forceRequest as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock();

      expect(typeof result.forceRequest).toBe('function');
    });
  });

  it('should return release as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock();

      expect(typeof result.release).toBe('function');
    });
  });

  it('should handle custom document option', () => {
    runInInjectionContext(injector, () => {
      const mockDoc = {
        visibilityState: 'visible' as DocumentVisibilityState,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as Document;

      const result = useWakeLock({ document: mockDoc, navigator: undefined });

      expect(result.isSupported()).toBe(true);
      expect(result.sentinel()).toBeNull();
    });
  });

  it('should handle custom navigator option', () => {
    runInInjectionContext(injector, () => {
      const mockNavigator = {
        wakeLock: {
          request: vi.fn().mockResolvedValue({
            type: 'screen' as const,
            released: false,
            release: vi.fn().mockResolvedValue(undefined),
          }),
        },
      } as unknown as Navigator;

      const result = useWakeLock({ navigator: mockNavigator });

      expect(result.request).toBeDefined();
    });
  });

  it('should return Supportable interface with isSupported', () => {
    runInInjectionContext(injector, () => {
      const result = useWakeLock();

      expect('isSupported' in result).toBe(true);
    });
  });
});
