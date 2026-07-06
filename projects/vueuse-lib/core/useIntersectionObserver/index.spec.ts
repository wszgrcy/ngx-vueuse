import { describe, expect, it, vi, beforeEach } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useIntersectionObserver } from './index';

describe('useIntersectionObserver', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should be defined', () => {
    expect(useIntersectionObserver).toBeDefined();
  });

  it('should observe intersection', () => {
    const callbackMock = vi.fn();
    const target = signal(document.body);

    const result = runWithInjector(() => useIntersectionObserver(target, callbackMock));

    expect(result.isSupported()).toBe(true);
    expect(result.isActive()).toBe(true);
  });

  it('should support pause and resume', () => {
    const callbackMock = vi.fn();
    const target = signal(document.body);

    const result = runWithInjector(() => useIntersectionObserver(target, callbackMock));

    expect(result.isActive()).toBe(true);

    result.pause();
    expect(result.isActive()).toBe(false);

    result.resume();
    expect(result.isActive()).toBe(true);
  });

  it('should stop observing when calling stop', () => {
    const callbackMock = vi.fn();
    const target = signal(document.body);

    const result = runWithInjector(() => useIntersectionObserver(target, callbackMock));

    expect(result.isActive()).toBe(true);

    result.stop();
    expect(result.isActive()).toBe(false);
  });

  it('should not start if immediate is false', () => {
    const callbackMock = vi.fn();
    const target = signal(document.body);

    const result = runWithInjector(() =>
      useIntersectionObserver(target, callbackMock, { immediate: false }),
    );

    expect(result.isActive()).toBe(false);

    result.resume();
    expect(result.isActive()).toBe(true);
  });

  it('should support custom root', () => {
    const callbackMock = vi.fn();
    const target = signal(document.body);
    const root = signal(document.body);

    const result = runWithInjector(() => useIntersectionObserver(target, callbackMock, { root }));

    expect(result.isSupported()).toBe(true);
  });

  it('should support threshold', () => {
    const callbackMock = vi.fn();
    const target = signal(document.body);

    const result = runWithInjector(() =>
      useIntersectionObserver(target, callbackMock, { threshold: [0, 0.5, 1] }),
    );

    expect(result.isSupported()).toBe(true);
  });

  it('should support rootMargin', () => {
    const callbackMock = vi.fn();
    const target = signal(document.body);

    const result = runWithInjector(() =>
      useIntersectionObserver(target, callbackMock, { rootMargin: '10px' }),
    );

    expect(result.isSupported()).toBe(true);
  });
});
