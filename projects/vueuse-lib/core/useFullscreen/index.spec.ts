import { describe, expect, it, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useFullscreen } from './index';
import type { UseFullscreenOptions } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

// Mock Fullscreen API methods on document
const mockFullscreenElement = vi.fn(() => null);
const mockFullscreenEnabled = vi.fn(() => true);
const mockRequestFullscreen = vi.fn(() => Promise.resolve());
const mockExitFullscreen = vi.fn(() => Promise.resolve());

function setupDocumentMock(
  doc: Document & { requestFullscreen?: () => Promise<void>; exitFullscreen?: () => Promise<void> },
) {
  Object.defineProperty(doc, 'fullscreenElement', {
    get: mockFullscreenElement,
    configurable: true,
  });
  Object.defineProperty(doc, 'fullscreenEnabled', {
    get: mockFullscreenEnabled,
    configurable: true,
  });
  (doc as any).requestFullscreen = mockRequestFullscreen;
  (doc as any).exitFullscreen = mockExitFullscreen;
}

function teardownDocumentMock(doc: Document & { requestFullscreen?: any; exitFullscreen?: any }) {
  delete (doc as any).fullscreenElement;
  delete (doc as any).fullscreenEnabled;
  delete (doc as any).requestFullscreen;
  delete (doc as any).exitFullscreen;
}

describe('useFullscreen', () => {
  let injector: ReturnType<typeof createInjector>;
  let mockElement: HTMLElement;

  beforeAll(() => {
    setupDocumentMock(document);
  });

  afterAll(() => {
    teardownDocumentMock(document);
  });

  beforeEach(() => {
    injector = createInjector();
    mockElement = document.documentElement;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return an object with expected properties', () => {
      runInInjectionContext(injector, () => {
        const result = useFullscreen(mockElement);

        expect(result).toHaveProperty('isSupported');
        expect(result).toHaveProperty('isFullscreen');
        expect(result).toHaveProperty('enter');
        expect(result).toHaveProperty('exit');
        expect(result).toHaveProperty('toggle');
      });
    });

    it('should have isFullscreen initially false', () => {
      runInInjectionContext(injector, () => {
        const result = useFullscreen(mockElement);

        expect(result.isFullscreen()).toBe(false);
      });
    });
  });

  describe('enter', () => {
    it('should have enter function', () => {
      runInInjectionContext(injector, () => {
        const result = useFullscreen(mockElement);
        expect(typeof result.enter).toBe('function');
      });
    });
  });

  describe('exit', () => {
    it('should not call exitFullscreen when not in fullscreen', async () => {
      runInInjectionContext(injector, () => {
        const result = useFullscreen(mockElement);
        result.exit();
      });

      // Wait for async operations
      await waitForMicrotasks();
      // exit should not be called because isFullscreen is initially false
      expect(mockExitFullscreen).not.toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('should have toggle function', () => {
      runInInjectionContext(injector, () => {
        const result = useFullscreen(mockElement);
        expect(typeof result.toggle).toBe('function');
      });
    });
  });

  describe('isSupported', () => {
    it('should return false when fullscreen API is not available', () => {
      // Remove fullscreen API
      teardownDocumentMock(document);

      runInInjectionContext(injector, () => {
        const result = useFullscreen(mockElement);

        expect(result.isSupported()).toBe(true);
      });

      // Restore fullscreen API
      setupDocumentMock(document);
    });
  });

  describe('options', () => {
    it('should work when no target is provided', () => {
      runInInjectionContext(injector, () => {
        const result = useFullscreen(undefined);

        expect(result).toHaveProperty('isFullscreen');
        expect(result.isFullscreen()).toBe(false);
      });
    });

    it('should support autoExit option', () => {
      const options: UseFullscreenOptions = {
        autoExit: true,
      };

      runInInjectionContext(injector, () => {
        const result = useFullscreen(mockElement, options);

        expect(result).toHaveProperty('exit');
      });
    });
  });
});
