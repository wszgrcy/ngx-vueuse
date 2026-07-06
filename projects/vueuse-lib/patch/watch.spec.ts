import { describe, expect, it, vi, afterEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { DestroyableInjector, signal } from '@angular/core';
import { watch } from './watch';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';
describe('watch', () => {
  let injector: DestroyableInjector;
  beforeEach(() => {
    injector = createInjector();
  });
  afterEach(() => {
    injector.destroy();
    vi.clearAllMocks();
  });
  it('hello', async () => {
    const v1 = signal(1);
    const callback = vi.fn();
    runInInjectionContext(injector, () => watch(v1, callback));
    v1.set(2);
    await waitForMicrotasks();
    console.log('等待完成');
    expect(callback).toHaveBeenCalledTimes(1);
    v1.set(3);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(2);
  });
  it('array', async () => {
    const v1 = signal(1);
    const v2 = signal(1);
    const callback = vi.fn();
    runInInjectionContext(injector, () => watch([v1, v2], callback));
    v1.set(2);
    v2.set(3);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    v1.set(3);
    v2.set(4);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(2);
  });
  it('once', async () => {
    const v1 = signal(1);
    const callback = vi.fn();
    runInInjectionContext(injector, () => watch([v1], callback, { once: true }));
    v1.set(2);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
    v1.set(3);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
  });
  it('immediate', async () => {
    const v1 = signal(1);
    const callback = vi.fn();
    runInInjectionContext(injector, () => watch([v1], callback, { once: false, immediate: true }));
    expect(callback).toHaveBeenCalledTimes(1);
    v1.set(2);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(2);
  });
  it('immediate-once', async () => {
    const v1 = signal(1);
    const callback = vi.fn();
    runInInjectionContext(injector, () => watch([v1], callback, { once: true, immediate: true }));
    expect(callback).toHaveBeenCalledTimes(1);
    v1.set(2);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
  });
  it('fn-no-watch', async () => {
    const v1 = signal(1);
    const v2 = signal(1);
    const callback = vi.fn();
    runInInjectionContext(injector, () =>
      watch(
        [v1],
        () => {
          v2();
          callback();
        },
        { immediate: true },
      ),
    );
    expect(callback).toHaveBeenCalledTimes(1);
    v2.set(2);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
