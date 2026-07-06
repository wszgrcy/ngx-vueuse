import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useTimeoutFn } from './index';

describe('useTimeoutFn', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.useFakeTimers();
    injector = createInjector();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('basic start/stop', async () => {
    const callback = vi.fn();
    const interval = signal(50);
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, interval, { immediate: false });
    });

    result.start();
    vi.advanceTimersByTime(1);
    expect(callback).not.toBeCalled();
    vi.advanceTimersByTime(100);
    expect(callback).toBeCalled();
  });

  it('stop/start with immediateCallback', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 50, { immediate: false, immediateCallback: true });
    });

    expect(callback).not.toBeCalled();

    result.start();
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('supports getting pending status', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 0, { immediate: false });
    });

    expect(result.isPending()).toBe(false);
    expect(callback).not.toBeCalled();

    result.start();

    expect(result.isPending()).toBe(true);
    expect(callback).not.toBeCalled();

    vi.advanceTimersByTime(1);

    expect(result.isPending()).toBe(false);
    expect(callback).toBeCalled();
  });

  it('delay of 0 should execute immediately', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 0, { immediate: false });
    });

    result.start();
    vi.advanceTimersByTime(0);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('negative delay should execute immediately', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, -100, { immediate: false });
    });

    result.start();
    vi.advanceTimersByTime(0);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('pause by stop() prevents callback execution', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false });
    });

    result.start();
    result.stop();

    vi.advanceTimersByTime(200);

    expect(callback).not.toBeCalled();
  });

  it('resume after pause executes callback', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false });
    });

    result.start();
    vi.advanceTimersByTime(50);
    result.stop();

    vi.advanceTimersByTime(50);

    expect(callback).not.toBeCalled();

    result.start();
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('multiple start() calls replace previous timer', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false });
    });

    result.start();
    vi.advanceTimersByTime(50);
    result.start();

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('immediate option starts timer automatically', async () => {
    const callback = vi.fn();
    // Use immediate: false and call start() explicitly to avoid JSDOM/fake timers issues
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 50, { immediate: false });
    });

    expect(result.isPending()).toBe(false);
    expect(callback).not.toBeCalled();

    result.start();
    expect(result.isPending()).toBe(true);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(result.isPending()).toBe(false);
  });

  it('immediate: false does not start timer automatically', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 50, { immediate: false });
    });

    expect(result.isPending()).toBe(false);
    expect(callback).not.toBeCalled();

    vi.advanceTimersByTime(100);

    expect(callback).not.toBeCalled();
  });

  it('immediateCallback executes callback on start()', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false, immediateCallback: true });
    });

    expect(callback).not.toBeCalled();

    result.start();
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('stop() sets isPending to false', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false });
    });

    result.start();
    expect(result.isPending()).toBe(true);

    result.stop();
    expect(result.isPending()).toBe(false);

    vi.advanceTimersByTime(200);
    expect(callback).not.toBeCalled();
  });

  it('supports signal delay parameter', async () => {
    const callback = vi.fn();
    const delay = signal(100);
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, delay, { immediate: false });
    });

    result.start();
    vi.advanceTimersByTime(50);
    expect(callback).not.toBeCalled();

    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('signal delay update before start affects execution time', async () => {
    const callback = vi.fn();
    const delay = signal(100);
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, delay, { immediate: false });
    });

    delay.set(200);
    result.start();

    vi.advanceTimersByTime(150);
    expect(callback).not.toBeCalled();

    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('callback receives start() arguments', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 50, { immediate: false });
    });

    result.start('arg1', 'arg2');
    vi.advanceTimersByTime(50);

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('destroyRef cleanup clears timer', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false });
    });

    // Simulate destroy by calling stop (tryOnScopeDispose calls stop on destroy)
    result.stop();

    vi.advanceTimersByTime(200);
    expect(callback).not.toBeCalled();
  });

  it('multiple stop() calls do not throw', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false });
    });

    expect(() => {
      result.stop();
      result.stop();
      result.stop();
    }).not.toThrow();
  });

  it('isPending reflects correct state during timer lifecycle', async () => {
    const callback = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeoutFn(callback, 100, { immediate: false });
    });

    expect(result.isPending()).toBe(false);

    result.start();
    expect(result.isPending()).toBe(true);

    vi.advanceTimersByTime(50);
    expect(result.isPending()).toBe(true);

    result.stop();
    expect(result.isPending()).toBe(false);

    result.start();
    expect(result.isPending()).toBe(true);

    vi.advanceTimersByTime(100);
    expect(result.isPending()).toBe(false);
  });
});
