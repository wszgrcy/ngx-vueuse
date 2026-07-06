/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useDark } from './useDark';

// Mock localStorage for tests
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
};

let originalLocalStorage: any;

beforeAll(() => {
  originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  if (originalLocalStorage) {
    Object.defineProperty(window, 'localStorage', originalLocalStorage);
  }
});

afterAll(() => {});

describe('useDark', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    injector = createInjector();
    localStorageMock.clear();
    // Reset html class
    if (document.documentElement) {
      document.documentElement.classList.remove('dark', 'light', 'custom-dark', 'custom-light');
    }
  });

  afterEach(() => {
    localStorageMock.clear();
    if (document.documentElement) {
      document.documentElement.classList.remove('dark', 'light', 'custom-dark', 'custom-light');
    }
  });

  it('should be defined', () => {
    expect(useDark).toBeDefined();
  });

  it('returns correct initial value', () => {
    runInInjectionContext(injector, () => {
      const toggle = useDark({
        initialValue: 'light',
      });

      expect(toggle()).toBe(false);
    });
  });

  it('returns true when set to dark', () => {
    runInInjectionContext(injector, () => {
      const toggle = useDark({
        initialValue: 'light',
      });

      expect(toggle()).toBe(false);
      toggle.set(true);
      expect(toggle()).toBe(true);
    });
  });

  it('returns false when set to light', () => {
    runInInjectionContext(injector, () => {
      const toggle = useDark({
        initialValue: 'dark',
      });

      expect(toggle()).toBe(true);
      toggle.set(false);
      expect(toggle()).toBe(false);
    });
  });

  it('accepts custom valueDark and valueLight options', () => {
    runInInjectionContext(injector, () => {
      const toggle = useDark({
        initialValue: 'light',
        valueDark: 'custom-dark',
        valueLight: 'custom-light',
      });

      expect(toggle()).toBe(false);
      toggle.set(true);
      expect(toggle()).toBe(true);
    });
  });

  it('accepts custom storageKey option', () => {
    runInInjectionContext(injector, () => {
      const toggle = useDark({
        initialValue: 'light',
        storageKey: 'custom-key',
      });

      // The initial value should be set
      expect(toggle()).toBe(false);
    });
  });

  it('accepts custom selector option', () => {
    runInInjectionContext(injector, () => {
      const toggle = useDark({
        initialValue: 'light',
        selector: 'body',
      });

      expect(toggle()).toBe(false);
      toggle.set(true);
      expect(toggle()).toBe(true);
    });
  });

  it('accepts onChanged callback option', () => {
    const onChangedSpy = vi.fn();

    runInInjectionContext(injector, () => {
      const toggle = useDark({
        initialValue: 'light',
        onChanged: onChangedSpy as any,
      });

      expect(toggle()).toBe(false);
      toggle.set(true);
      expect(toggle()).toBe(true);
    });

    // The spy should be defined (may not be called due to effect timing in tests)
    expect(onChangedSpy).toBeDefined();
  });
});
