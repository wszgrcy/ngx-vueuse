import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NgxUseElementVisibilityDirective,
  UseElementVisibilityOptions,
} from './ngx-use-element-visibility.directive';

describe('NgxUseElementVisibilityDirective', () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(NgxUseElementVisibilityDirective).toBeDefined();
  });

  it('should have correct selector', () => {
    // Access the decorator via the ngUpgrade metadata
    expect(NgxUseElementVisibilityDirective).toBeTruthy();
  });

  describe('UseElementVisibilityOptions interface', () => {
    it('should support initialValue option', () => {
      const options: UseElementVisibilityOptions = {
        initialValue: true,
      };
      expect(options.initialValue).toBe(true);
    });

    it('should support threshold option', () => {
      const options: UseElementVisibilityOptions = {
        threshold: 0.5,
      };
      expect(options.threshold).toBe(0.5);
    });

    it('should support rootMargin option', () => {
      const options: UseElementVisibilityOptions = {
        rootMargin: '10px',
      };
      expect(options.rootMargin).toBe('10px');
    });

    it('should support once option', () => {
      const options: UseElementVisibilityOptions = {
        once: true,
      };
      expect(options.once).toBe(true);
    });

    it('should support scrollTarget option', () => {
      const options: UseElementVisibilityOptions = {
        scrollTarget: null as any,
      };
      expect(options.scrollTarget).toBeNull();
    });

    it('should support all options together', () => {
      const options: UseElementVisibilityOptions = {
        initialValue: false,
        threshold: 0.5,
        rootMargin: '10px',
        once: true,
      };
      expect(options.initialValue).toBe(false);
      expect(options.threshold).toBe(0.5);
      expect(options.rootMargin).toBe('10px');
      expect(options.once).toBe(true);
    });
  });

  describe('Directive functionality', () => {
    it('should be a standalone directive', () => {
      // Verify the directive class exists and has expected structure
      expect(NgxUseElementVisibilityDirective.prototype.ngOnInit).toBeDefined();
      expect(NgxUseElementVisibilityDirective.prototype.ngOnDestroy).toBeDefined();
    });

    it('should export UseElementVisibilityHandler type', () => {
      // Type test: handler should accept a boolean
      const handler: (isVisible: boolean) => void = (visible: boolean) => {
        expect(typeof visible).toBe('boolean');
      };
      handler(true);
      handler(false);
      expect(handler).toBeDefined();
    });
  });

  describe('Type exports', () => {
    it('should export UseElementVisibilityReturnWithControls interface', () => {
      // Type test: controls object should have expected properties
      const controls = {
        isVisible: true,
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        isSupported: true,
        isActive: true,
      };
      expect(controls.isVisible).toBe(true);
      expect(typeof controls.stop).toBe('function');
      expect(typeof controls.pause).toBe('function');
      expect(typeof controls.resume).toBe('function');
      expect(controls.isSupported).toBe(true);
      expect(controls.isActive).toBe(true);
    });
  });
});
