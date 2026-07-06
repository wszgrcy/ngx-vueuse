import { describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { watchImmediate } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('watchImmediate', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  afterEach(() => {
    injector.destroy();
    vi.clearAllMocks();
  });

  it('should watch twice, once for immediate and one for value change', async () => {
    let currentRun = 1;
    const spy = vi.fn((valUpdate: string) => {
      if (currentRun === 1) expect(valUpdate).toEqual('vue-use');

      if (currentRun >= 2) expect(valUpdate).toEqual('VueUse');

      currentRun++;
    });

    const obj = signal('vue-use');
    runInInjectionContext(injector, () => watchImmediate(obj, spy));
    obj.set('VueUse');
    await waitForMicrotasks();
    expect(spy).toBeCalledTimes(2);
  });
});
