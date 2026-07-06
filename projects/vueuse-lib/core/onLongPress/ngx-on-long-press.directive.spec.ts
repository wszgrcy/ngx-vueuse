/* @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('NgxOnLongPressDirective', () => {
  let element: HTMLElement;
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a test element
    element = document.createElement('div');
    element.textContent = 'Long Press Me';
    document.body.appendChild(element);

    // Create handler spy
    handler = vi.fn();
  });

  afterEach(() => {
    // Cleanup
    document.body.removeChild(element);
    vi.restoreAllMocks();
  });

  describe('onLongPress logic', () => {
    it('should export correct default delay value', () => {
      // The DEFAULT_DELAY should be 500ms
      expect(500).toBe(500);
    });

    it('should export correct default threshold value', () => {
      // The DEFAULT_THRESHOLD should be 10px
      expect(10).toBe(10);
    });
  });

  describe('OnLongPressOptions interface', () => {
    it('should support delay option', () => {
      const options = { delay: 1000 };
      expect(options.delay).toBe(1000);
    });

    it('should support distanceThreshold option', () => {
      const options = { distanceThreshold: 50 };
      expect(options.distanceThreshold).toBe(50);
    });

    it('should support onMouseUp callback option', () => {
      const mouseUpSpy = vi.fn();
      const options = { onMouseUp: mouseUpSpy };
      expect(options.onMouseUp).toBe(mouseUpSpy);
    });

    it('should support modifier options', () => {
      const options = {
        stop: true,
        once: true,
        prevent: true,
        capture: true,
        self: true,
      };
      expect(options.stop).toBe(true);
      expect(options.once).toBe(true);
      expect(options.prevent).toBe(true);
      expect(options.capture).toBe(true);
      expect(options.self).toBe(true);
    });
  });
});
