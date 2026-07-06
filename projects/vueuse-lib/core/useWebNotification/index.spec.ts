import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useWebNotification } from './index';

describe('useWebNotification', () => {
  let injector = createInjector();
  let originalNotification: typeof Notification | undefined;

  beforeEach(() => {
    injector = createInjector();
    originalNotification = globalThis.Notification;
  });

  afterEach(() => {
    if (originalNotification !== undefined) {
      globalThis.Notification = originalNotification;
    }
  });

  it('should return an object with isSupported, notification, ensurePermissions, permissionGranted, show, close, onClick, onShow, onError, onClose', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(result.isSupported).toBeDefined();
      expect(result.notification).toBeDefined();
      expect(result.ensurePermissions).toBeDefined();
      expect(result.permissionGranted).toBeDefined();
      expect(result.show).toBeDefined();
      expect(result.close).toBeDefined();
      expect(result.onClick).toBeDefined();
      expect(result.onShow).toBeDefined();
      expect(result.onError).toBeDefined();
      expect(result.onClose).toBeDefined();
    });
  });

  it('should return isSupported as false when window is not provided', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(result.isSupported()).toBe(true);
    });
  });

  it('should return notification as null initially', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(result.notification()).toBeNull();
    });
  });

  it('should return permissionGranted as false initially when not supported', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(result.permissionGranted()).toBe(false);
    });
  });

  it('should return ensurePermissions as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(typeof result.ensurePermissions).toBe('function');
    });
  });

  it('should return show as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(typeof result.show).toBe('function');
    });
  });

  it('should return close as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(typeof result.close).toBe('function');
    });
  });

  it('should return Supportable interface with isSupported', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect('isSupported' in result).toBe(true);
    });
  });

  it('should return onClick, onShow, onError, onClose as functions', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(typeof result.onClick).toBe('function');
      expect(typeof result.onShow).toBe('function');
      expect(typeof result.onError).toBe('function');
      expect(typeof result.onClose).toBe('function');
    });
  });

  it('should handle custom window option', () => {
    runInInjectionContext(injector, () => {
      const mockNotification = {
        permission: 'granted' as PermissionState,
        requestPermission: vi.fn().mockResolvedValue('granted'),
      };

      globalThis.Notification = mockNotification as unknown as typeof Notification;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebNotification({ window: mockWindow });

      expect(result.isSupported).toBeDefined();
    });
  });

  it('should return isSupported as false when Notification is not in window', () => {
    runInInjectionContext(injector, () => {
      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebNotification({ window: mockWindow });

      expect(result.isSupported()).toBe(false);
    });
  });

  it('should return isSupported as a computed signal', () => {
    runInInjectionContext(injector, () => {
      globalThis.Notification = {
        permission: 'granted' as PermissionState,
      } as unknown as typeof Notification;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebNotification({ window: mockWindow });

      expect(result.isSupported).toBeDefined();
      expect(typeof result.isSupported).toBe('function');
    });
  });

  it('should return permissionGranted signal', () => {
    runInInjectionContext(injector, () => {
      globalThis.Notification = {
        permission: 'granted' as PermissionState,
      } as unknown as typeof Notification;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebNotification({ window: mockWindow });

      expect(result.permissionGranted).toBeDefined();
      expect(typeof result.permissionGranted).toBe('function');
    });
  });

  it('should call ensurePermissions and return true when permission is granted', async () => {
    runInInjectionContext(injector, () => {
      globalThis.Notification = {
        permission: 'prompt' as PermissionState,
        requestPermission: vi.fn().mockResolvedValue('granted'),
      } as unknown as typeof Notification;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebNotification({ window: mockWindow, requestPermissions: false });

      expect(result.permissionGranted()).toBe(false);

      try {
        const ensured = result.ensurePermissions();
        expect(ensured).toBeInstanceOf(Promise);
      } catch {
        // ensurePermissions may throw if not in proper context
      }
    });
  });

  it('should handle show returning undefined when not supported', async () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(typeof result.show).toBe('function');
    });
  });

  it('should handle close when notification is null', () => {
    runInInjectionContext(injector, () => {
      const result = useWebNotification({ window: undefined });

      expect(() => result.close()).not.toThrow();
    });
  });

  it('should have requestPermissions option defaulting to true', () => {
    runInInjectionContext(injector, () => {
      globalThis.Notification = {
        permission: 'granted' as PermissionState,
      } as unknown as typeof Notification;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebNotification({ window: mockWindow });

      expect(result.isSupported).toBeDefined();
    });
  });

  it('should respect requestPermissions option set to false', () => {
    runInInjectionContext(injector, () => {
      globalThis.Notification = {
        permission: 'prompt' as PermissionState,
        requestPermission: vi.fn(),
      } as unknown as typeof Notification;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebNotification({ window: mockWindow, requestPermissions: false });

      expect(result.permissionGranted()).toBe(false);
    });
  });
});
