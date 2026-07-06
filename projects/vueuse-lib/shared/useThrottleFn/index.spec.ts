import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useThrottleFn } from './index';

describe('useThrottleFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throttle function calls', async () => {
    const fn = vi.fn();
    const throttled = useThrottleFn(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1); // Not called again yet

    await vi.advanceTimersByTimeAsync(100);
  });

  it('should handle function arguments', () => {
    const fn = vi.fn((x: number, y: number) => x + y);
    const throttled = useThrottleFn(fn, 100);

    throttled(2, 3);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  it('should only call once per throttle period', async () => {
    const fn = vi.fn();
    const throttled = useThrottleFn(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);

    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should return a callable function', () => {
    const fn = vi.fn();
    const throttled = useThrottleFn(fn, 100);

    expect(typeof throttled).toBe('function');
  });

  it('should return a Promise', async () => {
    const fn = vi.fn((x: number) => x * 2);
    const throttled = useThrottleFn(fn, 100);

    const result = throttled(5);
    expect(result).toBeInstanceOf(Promise);
    await result;
    expect(fn).toHaveBeenCalledWith(5);
  });

  // === Vue原版测试场景: leading/trailing options ===

  it('should work with trailing option', async () => {
    const fn = vi.fn();
    const ms = 20;
    const run = useThrottleFn(fn, ms, true); // trailing: true

    run();
    run();
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(ms + 10);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should work with leading option', async () => {
    const fn = vi.fn();
    const ms = 20;
    const run = useThrottleFn(fn, ms, false, true); // leading: true

    run();
    expect(fn).toHaveBeenCalledTimes(1);

    run();
    run();
    expect(fn).toHaveBeenCalledTimes(1); // Not called again yet

    await vi.advanceTimersByTimeAsync(ms + 10);

    run();
    expect(fn).toHaveBeenCalledTimes(2);

    run();
    run();
    expect(fn).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(ms + 10);

    run();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should work with not leading and not trailing', async () => {
    const fn = vi.fn();
    const ms = 20;
    const run = useThrottleFn(fn, ms, false, false); // leading: false, trailing: false

    run();
    run();
    expect(fn).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(ms + 10);

    run();
    run();
    run();
    expect(fn).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(ms + 20);

    run();
    expect(fn).toHaveBeenCalledTimes(0);
  });
});
