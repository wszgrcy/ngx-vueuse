import { describe, expect, it, vi, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { watchImmediate } from './watchImmediate';
import { createInjector, runInInjectionContext } from '../test/injector';
import { waitForMicrotasks } from '../test/waitForMicrotasks';

describe('watchImmediate', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should watch twice — once for immediate and once for value change', async () => {
    let currentRun = 1;
    const spy = vi.fn((valUpdate: any) => {
      if (currentRun === 1) expect(valUpdate).toEqual('vue-use');

      if (currentRun >= 2) expect(valUpdate).toEqual('VueUse');

      currentRun++;
    });

    runInInjectionContext(injector, () => {
      const obj = signal('vue-use');
      watchImmediate(obj, spy);
      obj.set('VueUse');
    });

    // Wait for effect to run (zoneless mode requires tick)
    await waitForMicrotasks();
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should stop watching when stop() is called', async () => {
    const spy = vi.fn();

    let result: ReturnType<typeof watchImmediate> | undefined;
    let obj: ReturnType<typeof signal<string>>;

    runInInjectionContext(injector, () => {
      obj = signal('initial');
      result = watchImmediate(obj, spy);
      obj.set('changed');
    });

    await waitForMicrotasks();
    expect(spy).toHaveBeenCalledTimes(2);

    result?.stop();
    spy.mockClear();

    // Same signal instance, effect is destroyed — should not trigger
    runInInjectionContext(injector, () => {
      obj.set('after-stop');
    });

    await waitForMicrotasks();
    expect(spy).not.toHaveBeenCalled();
  });

  // Skipped: This test uses a non-signal variable (counter) which cannot be tracked by Angular's reactive system.
  // In Vue, watch can track getter functions that return non-ref values, but Angular signals require signal dependencies.
  /*
  it('should support getter function as source', async () => {
    let currentRun = 1;
    const spy = vi.fn((valUpdate: any) => {
      if (currentRun === 1) expect(valUpdate).toEqual(0);

      if (currentRun >= 2) expect(valUpdate).toEqual(10);

      currentRun++;
    });

    let counter = 0;
    const getter = () => counter;

    const result = runInInjectionContext(injector, () => watchImmediate(getter, spy));

    runInInjectionContext(injector, () => {
      counter = 10;
    });

    await waitForMicrotasks();
    expect(spy).toHaveBeenCalledTimes(2);
    result.stop();
  });
  */
});
