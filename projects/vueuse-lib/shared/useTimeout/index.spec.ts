import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useTimeout } from './index';

describe('useTimeout', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.useFakeTimers();
    injector = createInjector();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return an object with controls when enabled', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(1000, { controls: true });
    }) as any;

    expect(typeof result.ready).toBe('function');
    expect('stop' in result).toBe(true);
  });

  it('should handle 0ms timeout', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(0);
    });

    expect(result()).toBeDefined();
  });

  it('should return a signal-like result', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(100);
    });

    expect(typeof result).toBe('function');
  });

  it('should accept number timeout', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(500);
    });

    expect(typeof result()).toBe('boolean');
  });

  it('should work with controls enabled', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(1000, { controls: true });
    }) as any;

    expect(typeof result.ready).toBe('function');
    expect(typeof result.isPending).toBe('function');
    expect(typeof result.stop).toBe('function');
    expect(typeof result.start).toBe('function');
  });

  // === Vue原版测试场景: timer advancement ===

  it('should transition from false to true after timeout', () => {
    let ready: any;
    runInInjectionContext(injector, () => {
      ready = useTimeout(10);
    });

    expect(ready()).toBe(false);

    vi.advanceTimersByTime(10);

    expect(ready()).toBe(true);
  });

  it('should work with controls and advance timer', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(10, { controls: true });
    }) as any;

    expect(result.ready()).toBe(false);

    vi.advanceTimersByTime(10);

    expect(result.ready()).toBe(true);
  });

  it('should work with signal interval', () => {
    const interval = signal(10);
    let ready: any;
    runInInjectionContext(injector, () => {
      ready = useTimeout(interval);
    });

    expect(ready()).toBe(false);

    vi.advanceTimersByTime(10);

    expect(ready()).toBe(true);
  });

  it('should work with signal interval and controls', () => {
    const interval = signal(10);
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(interval, { controls: true });
    }) as any;

    expect(result.ready()).toBe(false);

    vi.advanceTimersByTime(10);

    expect(result.ready()).toBe(true);
  });

  it('should handle custom timeout values', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useTimeout(500);
    });

    expect(result()).toBe(false);

    vi.advanceTimersByTime(499);
    expect(result()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(result()).toBe(true);
  });
});
