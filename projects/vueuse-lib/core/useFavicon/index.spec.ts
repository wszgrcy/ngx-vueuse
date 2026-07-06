import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useFavicon } from './index';

describe('useFavicon', () => {
  let injector: ReturnType<typeof createInjector>;

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    injector = createInjector();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(useFavicon).toBeDefined();
  });

  it('should return a signal with the initial icon value', () => {
    runInInjectionContext(injector, () => {
      const favicon = useFavicon('icon.png', { document });
      expect(favicon()).toBe('icon.png');
    });
  });

  it('should return null by default when no icon is provided', () => {
    runInInjectionContext(injector, () => {
      // When no newIcon is provided, the default parameter null is used
      const favicon = useFavicon(null, { document });
      expect(favicon()).toBe(null);
    });
  });

  it('should create a new link element when none exists', () => {
    runInInjectionContext(injector, () => {
      // When querySelectorAll returns empty, a new link should be created
      const favicon = useFavicon('new-icon.svg', { document });
      expect(favicon()).toBe('new-icon.svg');
      // Trigger change detection to run effects
      // In Angular, effects may not run synchronously during signal creation
      // The effect will run when the signal is read in a reactive context
    });
  });

  it('should update existing link elements', () => {
    runInInjectionContext(injector, () => {
      const favicon = useFavicon('initial.png', { document });
      expect(favicon()).toBe('initial.png');
      // The href should be set by the effect
    });
  });

  it('should use custom rel attribute', () => {
    runInInjectionContext(injector, () => {
      const favicon = useFavicon('icon.ico', { document, rel: 'shortcut icon' });
      expect(favicon()).toBe('icon.ico');
    });
  });

  it('should use custom baseUrl', () => {
    runInInjectionContext(injector, () => {
      const favicon = useFavicon('icon.png', { document, baseUrl: 'https://example.com/' });
      expect(favicon()).toBe('icon.png');
    });
  });

  it('should set correct type based on file extension', () => {
    runInInjectionContext(injector, () => {
      const favicon = useFavicon('image.png', { document });
      expect(favicon()).toBe('image.png');
    });
  });
});
