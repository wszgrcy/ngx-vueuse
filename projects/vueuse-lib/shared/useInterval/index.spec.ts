import { describe, expect, it, vi, beforeEach } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useInterval } from './index';

describe('useInterval', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [] });
    injector = createInjector();
  });

  it('should start count at 0', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(100);
    });

    expect(result()).toBe(0);
  });

  it('should increment count over time', async () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(50);
    });

    expect(result()).toBe(0);

    // Wait for first tick
    await new Promise((r) => setTimeout(r, 60));
    expect(result()).toBeGreaterThanOrEqual(1);
  });

  it('should handle custom callback', async () => {
    const cb = vi.fn();
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(50, { callback: cb, controls: true });
    });

    expect(typeof result.pause).toBe('function');

    // Wait for a tick to trigger callback
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.mock.calls.length).toBeGreaterThanOrEqual(1);

    result.pause();
  });

  it('should work with controls option', async () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(50, { controls: true });
    });

    expect(typeof result.pause).toBe('function');
    expect(typeof result.resume).toBe('function');
    expect(typeof result.reset).toBe('function');
    expect(result.counter()).toBe(0);

    await new Promise((r) => setTimeout(r, 60));
    const countBefore = result.counter();

    result.reset();
    expect(result.counter()).toBe(0);
  });

  it('should expose count in controls mode', async () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(50, { controls: true });
    });

    expect(result.counter()).toBe(0);

    await new Promise((r) => setTimeout(r, 60));
    expect(result.counter()).toBeGreaterThanOrEqual(1);
  });

  it('should pause and resume', async () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(50, { controls: true });
    });

    expect(result.counter()).toBe(0);

    result.pause();
    const countBeforePause = result.counter();

    await new Promise((r) => setTimeout(r, 80));
    expect(result.counter()).toBe(countBeforePause); // Should not increment while paused

    result.resume();
    await new Promise((r) => setTimeout(r, 60));
    expect(result.counter()).toBeGreaterThan(countBeforePause);
  });

  it('should accept number interval', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(500, { controls: true });
    });

    expect(typeof result.pause).toBe('function');
  });

  it('should expose read-only counter signals', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(100);
    });

    expect(result()).toBe(0);
    expect('set' in result).toBe(false);

    let controlsResult: any;
    runInInjectionContext(injector, () => {
      controlsResult = useInterval(100, { controls: true });
    });

    expect(controlsResult.counter()).toBe(0);
    expect('set' in controlsResult.counter).toBe(false);
  });

  it('should work with immediate: false', () => {
    let result: any;
    runInInjectionContext(injector, () => {
      result = useInterval(100, { controls: true, immediate: false });
    });

    expect(result.counter()).toBe(0);
    // Should not start automatically
  });

  it('should react to signal interval changes', async () => {
    const interval = signal(50);
    let result: any;

    runInInjectionContext(injector, () => {
      result = useInterval(interval, { controls: true });
    });

    expect(result.counter()).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 60));
    const countBefore = result.counter();

    interval.set(20);
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(result.counter()).toBeGreaterThan(countBefore);
  });
});
