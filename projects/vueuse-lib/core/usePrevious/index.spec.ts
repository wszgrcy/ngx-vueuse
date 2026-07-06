import { describe, expect, it, beforeEach } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { usePrevious } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('usePrevious', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should be defined', () => {
    expect(usePrevious).toBeDefined();
  });

  it('works for literals', async () => {
    const target = signal(1);
    const previous = runWithInjector(() => usePrevious(target));

    expect(previous()).toBe(undefined);

    target.set(2);
    await waitForMicrotasks();
    expect(previous()).toBe(1);

    target.set(10);
    await waitForMicrotasks();
    expect(previous()).toBe(2);
  });

  it('works with initial value', async () => {
    const target = signal('Hello');
    const previous = runWithInjector(() => usePrevious(target, 'initial'));

    expect(previous()).toBe('initial');

    target.set('World');
    await waitForMicrotasks();

    expect(previous()).toBe('Hello');
  });

  it('works with object', async () => {
    const target = signal<{ a: number } | null>({ a: 1 });
    const previous = runWithInjector(() => usePrevious(target));
    await waitForMicrotasks();
    expect(previous()).toBe(undefined);

    target.set({ a: 2 });
    await waitForMicrotasks();

    expect(previous()).deep.eq({ a: 1 });

    target.set({ a: 2 as unknown as number });
    await waitForMicrotasks();

    expect(previous()).deep.eq({ a: 2 });
  });

  it('works with array', async () => {
    const target = signal<number[]>([1, 2, 3]);
    const previous = runWithInjector(() => usePrevious(target));

    expect(previous()).toBe(undefined);

    target.set([4, 5, 6]);
    await waitForMicrotasks();

    expect(previous()).toEqual([1, 2, 3]);
  });

  it('works with string', async () => {
    const target = signal('foo');
    const previous = runWithInjector(() => usePrevious(target));

    expect(previous()).toBe(undefined);

    target.set('bar');
    await waitForMicrotasks();

    expect(previous()).toBe('foo');
  });

  it('works with number', async () => {
    const target = signal(0);
    const previous = runWithInjector(() => usePrevious(target));

    expect(previous()).toBe(undefined);

    target.set(1);
    await waitForMicrotasks();

    expect(previous()).toBe(0);
  });
});
