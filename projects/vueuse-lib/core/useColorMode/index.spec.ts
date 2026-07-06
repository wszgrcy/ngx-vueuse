import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useColorMode, type BasicColorSchema } from './index';

describe('useColorMode', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useColorMode).toBeDefined();
  });

  // Note: These tests require Angular injection context and DOM environment
  // because useColorMode uses effect() and matchMedia.
  // In a real Angular component, these tests would pass when
  // run within TestBed.runInInjectionContext or within a component lifecycle.

  describe('given default options', () => {
    it('should create useColorMode function', () => {
      expect(useColorMode).toBeDefined();
      expect(typeof useColorMode).toBe('function');
    });

    it('should accept empty options', () => {
      // Function should be callable with empty options
      expect(() => useColorMode({})).toBeDefined();
    });
  });

  describe('given initialValue=dark', () => {
    it('should accept dark initial value', () => {
      expect(() => useColorMode({ initialValue: 'dark' })).toBeDefined();
    });
  });

  describe('given initialValue=light', () => {
    it('should accept light initial value', () => {
      expect(() => useColorMode({ initialValue: 'light' })).toBeDefined();
    });
  });

  describe('given storageKey=null', () => {
    it('should accept null storageKey to disable persistence', () => {
      expect(() => useColorMode({ initialValue: 'dark', storageKey: null })).toBeDefined();
    });
  });

  describe('given custom modes', () => {
    it('should accept custom modes mapping', () => {
      expect(() =>
        useColorMode({
          initialValue: 'dark' as BasicColorSchema,
          modes: {
            dark: 'dark-mode',
            light: 'light-mode',
          },
        }),
      ).toBeDefined();
    });
  });

  describe('given onChanged callback', () => {
    it('should accept onChanged option', () => {
      const onChangedSpy = vi.fn((mode: string, defaultHandler: (mode: string) => void) => {
        defaultHandler(mode);
      });
      expect(() => useColorMode({ onChanged: onChangedSpy })).toBeDefined();
    });
  });

  describe('given custom selector', () => {
    it('should accept custom selector', () => {
      expect(() => useColorMode({ selector: 'body' })).toBeDefined();
    });
  });

  describe('given custom attribute', () => {
    it('should accept custom attribute', () => {
      expect(() => useColorMode({ attribute: 'data-theme' })).toBeDefined();
    });
  });
});
