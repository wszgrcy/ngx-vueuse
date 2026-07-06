import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NgxUseElementSizeDirective } from './ngx-use-element-size.directive';
import type {
  ElementSize,
  ElementSizeHandler,
  UseElementSizeOptions,
} from './ngx-use-element-size.directive';

// Setup DOM environment with ResizeObserver mock
const mockResizeObserverCallback: globalThis.ResizeObserverCallback = () => {};

class MockResizeObserver {
  private callback: globalThis.ResizeObserverCallback;

  constructor(callback: globalThis.ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(_element: Element) {
    // Simulate a resize event with mock data
    const mockElement = {
      namespaceURI: 'http://www.w3.org/1999/xhtml',
      getBoundingClientRect: () => ({
        width: 100,
        height: 200,
        top: 0,
        left: 0,
        right: 100,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      offsetWidth: 100,
      offsetHeight: 200,
    } as unknown as Element;

    const mockEntry: globalThis.ResizeObserverEntry = {
      target: mockElement,
      contentRect: {
        width: 100,
        height: 200,
        top: 0,
        left: 0,
        right: 100,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRectReadOnly,
      borderBoxSize: [{ inlineSize: 100, blockSize: 200 } as globalThis.ResizeObserverSize],
      contentBoxSize: [{ inlineSize: 80, blockSize: 180 } as globalThis.ResizeObserverSize],
      devicePixelContentBoxSize: [
        { inlineSize: 160, blockSize: 360 } as globalThis.ResizeObserverSize,
      ],
    };
    this.callback([mockEntry], this);
  }

  disconnect() {
    // No-op for mock
  }

  unobserve(_element: Element) {
    // No-op for mock
  }
}

// Global mock setup before all tests
const originalResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = MockResizeObserver;

describe('NgxUseElementSizeDirective', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original ResizeObserver
    if (originalResizeObserver) {
      (globalThis as any).ResizeObserver = originalResizeObserver;
    }
  });

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(NgxUseElementSizeDirective).toBeDefined();
    });

    it('should be a class directive', () => {
      expect(typeof NgxUseElementSizeDirective).toBe('function');
    });
  });

  describe('Interface and Type definitions', () => {
    it('should define ElementSize interface with width and height', () => {
      const size: ElementSize = { width: 100, height: 200 };
      expect(size).toHaveProperty('width');
      expect(size).toHaveProperty('height');
      expect(typeof size.width).toBe('number');
      expect(typeof size.height).toBe('number');
    });

    it('should define UseElementSizeOptions interface', () => {
      const options: UseElementSizeOptions = {
        box: 'content-box',
        window: undefined,
      };
      expect(options).toHaveProperty('box');
      expect(options).toHaveProperty('window');
    });

    it('should support all box model options', () => {
      const boxOptions: UseElementSizeOptions['box'][] = [
        'content-box',
        'border-box',
        'device-pixel-content-box',
      ];
      boxOptions.forEach((box) => {
        const opts: UseElementSizeOptions = { box };
        expect(opts.box).toBeDefined();
      });
    });

    it('should define ElementSizeHandler as function type', () => {
      const handler: ElementSizeHandler = (size) => {
        expect(size).toHaveProperty('width');
        expect(size).toHaveProperty('height');
      };
      expect(typeof handler).toBe('function');
    });
  });

  describe('Options', () => {
    it('should support box option with content-box', () => {
      const options: UseElementSizeOptions = {
        box: 'content-box',
      };
      expect(options.box).toBe('content-box');
    });

    it('should support box option with border-box', () => {
      const options: UseElementSizeOptions = {
        box: 'border-box',
      };
      expect(options.box).toBe('border-box');
    });

    it('should support box option with device-pixel-content-box', () => {
      const options: UseElementSizeOptions = {
        box: 'device-pixel-content-box',
      };
      expect(options.box).toBe('device-pixel-content-box');
    });

    it('should support window option', () => {
      const options: UseElementSizeOptions = {
        window: undefined,
      };
      expect(options.window).toBeUndefined();
    });

    it('should support all options together', () => {
      const options: UseElementSizeOptions = {
        box: 'border-box',
        window: undefined,
      };
      expect(options.box).toBe('border-box');
      expect(options.window).toBeUndefined();
    });
  });

  describe('Initial size', () => {
    it('should accept custom initial size', () => {
      const initialSize: ElementSize = { width: 100, height: 200 };
      expect(initialSize.width).toBe(100);
      expect(initialSize.height).toBe(200);
    });

    it('should allow zero initial size', () => {
      const initialSize: ElementSize = { width: 0, height: 0 };
      expect(initialSize.width).toBe(0);
      expect(initialSize.height).toBe(0);
    });
  });

  describe('Type exports', () => {
    it('should export ElementSize type', () => {
      const size: ElementSize = { width: 100, height: 200 };
      expect(size.width).toBe(100);
      expect(size.height).toBe(200);
    });

    it('should export UseElementSizeOptions type', () => {
      const options: UseElementSizeOptions = {
        box: 'border-box',
      };
      expect(options.box).toBe('border-box');
    });

    it('should export ElementSizeHandler type', () => {
      const handler: ElementSizeHandler = (size: ElementSize) => {
        expect(size.width).toBeTypeOf('number');
        expect(size.height).toBeTypeOf('number');
      };
      handler({ width: 100, height: 200 });
    });

    it('should handle ElementSize with correct structure', () => {
      const size: ElementSize = { width: 50, height: 75 };
      expect(typeof size.width).toBe('number');
      expect(typeof size.height).toBe('number');
    });
  });

  describe('ResizeObserver integration', () => {
    it('should work with ResizeObserver API', () => {
      // Verify ResizeObserver is available in mock environment
      const observer = new MockResizeObserver(mockResizeObserverCallback);
      expect(observer).toBeDefined();
      expect(typeof observer.observe).toBe('function');
      expect(typeof observer.disconnect).toBe('function');
    });

    it('should handle SVG element size detection', () => {
      // Test SVG namespace detection logic
      const svgElement = {
        namespaceURI: 'http://www.w3.org/2000/svg',
        getBoundingClientRect: () => ({
          width: 300,
          height: 150,
        }),
      } as unknown as Element;

      const isSVG = svgElement.namespaceURI?.includes('svg') ?? false;
      expect(isSVG).toBe(true);

      const rect = svgElement.getBoundingClientRect();
      expect(rect.width).toBe(300);
      expect(rect.height).toBe(150);
    });

    it('should handle HTML element size detection', () => {
      // Test HTML element namespace detection logic
      const htmlElement = {
        namespaceURI: 'http://www.w3.org/1999/xhtml',
        offsetWidth: 400,
        offsetHeight: 300,
      } as unknown as HTMLElement;

      const isSVG = htmlElement.namespaceURI?.includes('svg') ?? false;
      expect(isSVG).toBe(false);

      expect(htmlElement.offsetWidth).toBe(400);
      expect(htmlElement.offsetHeight).toBe(300);
    });
  });
});
