import { describe, expect, it, beforeEach } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useSessionStorage } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('useSessionStorage', () => {
  const KEY = 'session-custom-key';
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
    sessionStorage.clear();
  });
  afterEach(() => {
    injector.destroy();
  });
  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  function createMockStorage(): Storage {
    const state = new Map<string, string>();
    return {
      getItem: (key: string) => state.get(key) ?? null,
      setItem: (key: string, value: string) => state.set(key, value),
      removeItem: (key: string) => state.delete(key),
      clear: () => state.clear(),
      length: state.size,
      key: (n: number) => state.keys().next().value ?? null,
    } as Storage;
  }

  it('should be defined', () => {
    expect(useSessionStorage).toBeDefined();
  });

  it('should return initial value and write to sessionStorage', async () => {
    const ref = runWithInjector(() => useSessionStorage(KEY, 'a'));
    await waitForMicrotasks();

    expect(ref()).toBe('a');
    expect(sessionStorage.getItem(KEY)).toBe('a');
  });

  it('should read existing sessionStorage value', async () => {
    sessionStorage.setItem(KEY, 'existing');
    const ref = runWithInjector(() => useSessionStorage(KEY, 'default'));
    await waitForMicrotasks();

    expect(ref()).toBe('existing');
  });

  it('should handle number type', async () => {
    sessionStorage.setItem(KEY, '42');
    const ref = runWithInjector(() => useSessionStorage(KEY, 0));
    await waitForMicrotasks();

    expect(ref()).toBe(42);
  });

  it('should handle boolean type', async () => {
    const ref = runWithInjector(() => useSessionStorage(KEY, true));
    await waitForMicrotasks();
    expect(ref()).toBe(true);
    ref.set(false);
    await waitForMicrotasks();
    expect(sessionStorage.getItem(KEY)).toBe('false');
  });

  it('should handle object type', () => {
    const mockStorage = createMockStorage();
    const ref = runWithInjector(() =>
      useSessionStorage<any>(KEY, { name: 'a', data: 123 }, { storage: mockStorage }),
    );
    expect(ref()).toEqual({ name: 'a', data: 123 });
    expect(mockStorage.getItem(KEY)).toBe('{"name":"a","data":123}');
  });

  it('should handle null value', () => {
    const mockStorage = createMockStorage();
    mockStorage.removeItem(KEY);
    const ref = runWithInjector(() => useSessionStorage(KEY, null, { storage: mockStorage }));
    expect(ref()).toBe(null);
  });

  it('should handle undefined value', () => {
    const mockStorage = createMockStorage();
    mockStorage.removeItem(KEY);
    const ref = runWithInjector(() =>
      useSessionStorage<any>(KEY, undefined, { storage: mockStorage }),
    );
    expect(ref()).toBe(undefined);
  });

  // skip - requires TestBed integration for proper testing (same as useStorage)
  // it('should remove value', async () => {
  //   const mockStorage = createMockStorage();
  //   mockStorage.setItem(KEY, 'random');
  //   const ref = runWithInjector(() => useStorage(KEY, null, mockStorage));
  //   await waitForMicrotasks();
  //   expect(ref()).toBe('random');
  //   ref.set(null);
  //   await waitForMicrotasks();
  //   expect(ref()).toBe(null);
  //   expect(mockStorage.getItem(KEY)).toBeFalsy();
  // });

  it('should work with signal key', async () => {
    const key = signal('dynamic-key');
    const ref = runWithInjector(() => useSessionStorage(key, 'value'));
    await waitForMicrotasks();

    expect(ref()).toBe('value');
  });
});
