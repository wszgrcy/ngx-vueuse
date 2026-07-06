import { describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { useCached } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

function arrayEquals<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

describe('useCached', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  afterEach(() => {
    injector.destroy();
    vi.clearAllMocks();
  });
  it('should be defined', () => {
    expect(useCached).toBeDefined();
  });

  it('should work with default comparator', async () => {
    const booleanSignal = signal(true);
    const cachedBooleanSignal = runInInjectionContext(injector, () => useCached(booleanSignal));
    await waitForMicrotasks();

    expect(cachedBooleanSignal()).toBe(booleanSignal());

    booleanSignal.set(false);
    await waitForMicrotasks();

    expect(cachedBooleanSignal()).toBe(booleanSignal());
  });

  it('should work with custom comparator', async () => {
    const arraySignal = signal([1] as number[]);
    const initialArrayValue = arraySignal();

    const cachedArraySignal = runInInjectionContext(injector, () =>
      useCached(arraySignal, arrayEquals),
    );
    await waitForMicrotasks();

    expect(cachedArraySignal()).toBe(initialArrayValue);

    arraySignal.set(initialArrayValue);
    await waitForMicrotasks();

    expect(cachedArraySignal()).toBe(initialArrayValue);

    arraySignal.set([1]);
    await waitForMicrotasks();

    expect(cachedArraySignal()).toBe(initialArrayValue);

    arraySignal.set([2]);
    await waitForMicrotasks();

    expect(cachedArraySignal()).not.toBe(initialArrayValue);
    expect(cachedArraySignal()).toEqual([2]);
  });

  it('should pass new value first and keep cache when comparator returns true', async () => {
    const source = signal(0);
    const comparator = vi.fn(() => true);
    const cached = runInInjectionContext(injector, () => useCached(source, comparator));

    await waitForMicrotasks();

    source.set(1);
    await waitForMicrotasks();

    expect(comparator).toHaveBeenCalledWith(1, 0);
    expect(cached()).toBe(0);
  });

  it('should pass latest cached value on subsequent comparator calls', async () => {
    const source = signal(0);
    const comparator = vi.fn((newValue: number, cachedValue: number) => newValue === cachedValue);
    const cached = runInInjectionContext(injector, () => useCached(source, comparator));

    await waitForMicrotasks();

    source.set(1);
    await waitForMicrotasks();

    source.set(2);
    await waitForMicrotasks();

    expect(comparator).toHaveBeenNthCalledWith(1, 0, 0);
    expect(comparator).toHaveBeenNthCalledWith(2, 1, 0);
    expect(cached()).toBe(2);
  });

  describe('should work with options.deepRefs', () => {
    // Angular signals are always shallow by default
    it('should return signal (shallow by default)', () => {
      const value = signal(1);
      const cachedValue = runInInjectionContext(injector, () => useCached(value, vi.fn()));
      expect(cachedValue).toBeDefined();
    });

    it('should return signal if true', () => {
      const value = signal(1);
      const cachedValue = runInInjectionContext(injector, () =>
        useCached(value, vi.fn(), { deepRefs: true }),
      );
      expect(cachedValue).toBeDefined();
    });

    it('should return signal if false', () => {
      const value = signal(1);
      const cachedValue = runInInjectionContext(injector, () =>
        useCached(value, vi.fn(), { deepRefs: false }),
      );
      expect(cachedValue).toBeDefined();
    });
  });
});
