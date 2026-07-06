import { signal } from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';
import { useCached } from './useCached';

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
    vi.clearAllMocks();
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useCached).toBeDefined();
  });

  it('should work with default comparator', async () => {
    const booleanSignal = signal(true);

    const cachedBooleanSignal = runInInjectionContext(injector, () =>
      useCached(() => booleanSignal()),
    );

    // Wait for effect to run
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(cachedBooleanSignal()).toBe(booleanSignal());

    booleanSignal.set(false);
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(cachedBooleanSignal()).toBe(booleanSignal());
  });

  it('should work with custom comparator', async () => {
    const arraySignal = signal([1] as number[]);
    const initialArrayValue = arraySignal();

    const cachedArraySignal = runInInjectionContext(injector, () =>
      useCached(() => arraySignal(), arrayEquals),
    );

    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(cachedArraySignal()).toBe(initialArrayValue);

    arraySignal.set(initialArrayValue);
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(cachedArraySignal()).toBe(initialArrayValue);

    arraySignal.set([1]);
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(cachedArraySignal()).toBe(initialArrayValue);

    arraySignal.set([2]);
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(cachedArraySignal()).not.toBe(initialArrayValue);
    expect(cachedArraySignal()).toEqual([2]);
  });

  it('should pass new value first and keep cache when comparator returns true', async () => {
    const source = signal(0);
    const comparator = vi.fn(() => true);
    const cached = runInInjectionContext(injector, () => useCached(() => source(), comparator));

    await waitForMicrotasks();
    await waitForMicrotasks();

    source.set(1);
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(comparator).toHaveBeenCalledWith(1, 0);
    expect(cached()).toBe(0);
  });

  it('should pass latest cached value on subsequent comparator calls', async () => {
    const source = signal(0);
    const comparatorCalls: Array<[number, number]> = [];
    const comparator = vi.fn((newValue: number, cachedValue: number) => {
      comparatorCalls.push([newValue, cachedValue]);
      return newValue === cachedValue;
    });
    const cached = runInInjectionContext(injector, () => useCached(() => source(), comparator));

    await waitForMicrotasks();
    await waitForMicrotasks();
    comparatorCalls.length = 0; // clear initial calls

    source.set(1);
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(comparatorCalls[0]).toEqual([1, 0]);
    expect(cached()).toBe(1);

    comparatorCalls.length = 0;

    source.set(2);
    await waitForMicrotasks();
    await waitForMicrotasks();

    expect(comparatorCalls[0]).toEqual([2, 1]);
    expect(cached()).toBe(2);
  });

  describe('should work with options', () => {
    it('should return signal and work with immediate option', async () => {
      const value = signal(1);

      const cachedValue = runInInjectionContext(injector, () =>
        useCached(() => value(), vi.fn(), { immediate: true }),
      );
      expect(typeof cachedValue).toBe('function');
      expect(cachedValue()).toBe(1);
    });
  });
});
