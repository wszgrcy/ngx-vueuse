import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useIntersectionObserver } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('useIntersectionObserver', () => {
  let callback: IntersectionObserverCallback;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    callback = vi.fn();
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useIntersectionObserver).toBeDefined();
  });

  it('should create an IntersectionObserver when given an element', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback),
    );

    expect(result).toBeDefined();
    expect(result.stop).toBeDefined();
    expect(result.isSupported()).toBe(true);
    expect(result.isActive()).toBe(true);
  });

  it('should observe multiple elements', () => {
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver([element1, element2], callback),
    );

    expect(result).toBeDefined();
  });

  it('should provide a stop method that can be called', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback),
    );

    // Should not throw
    result.stop();
  });

  it('should support pause and resume', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback),
    );

    expect(result.isActive()).toBe(true);

    result.pause();
    expect(result.isActive()).toBe(false);

    result.resume();
    expect(result.isActive()).toBe(true);
  });

  it('should stop observing when calling stop', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback),
    );

    result.stop();
    expect(result.isActive()).toBe(false);
  });

  it('should not observe when targets is empty', () => {
    const result = runInInjectionContext(injector, () => useIntersectionObserver([], callback));

    expect(result).toBeDefined();
  });

  it('should support immediate: false', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback, { immediate: false }),
    );

    expect(result.isActive()).toBe(false);

    result.resume();
    expect(result.isActive()).toBe(true);
  });

  it('should support root option', () => {
    const element = document.createElement('div');
    const root = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback, { root }),
    );

    expect(result).toBeDefined();
  });

  it('should support rootMargin option', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback, { rootMargin: '10px' }),
    );

    expect(result).toBeDefined();
  });

  it('should support threshold option', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback, { threshold: 0.5 }),
    );

    expect(result).toBeDefined();
  });

  it('should support threshold as array', () => {
    const element = document.createElement('div');
    const result = runInInjectionContext(injector, () =>
      useIntersectionObserver(element, callback, { threshold: [0, 0.5, 1] }),
    );

    expect(result).toBeDefined();
  });
});
