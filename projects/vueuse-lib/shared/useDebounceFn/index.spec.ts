import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useDebounceFn } from './index';

describe('useDebounceFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', async () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should have cancel method', () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 100);

    expect(typeof (debounced as any).cancel).toBe('function');
  });

  it('should have flush method', () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 100);

    expect(typeof (debounced as any).flush).toBe('function');
  });

  it('should handle function arguments', async () => {
    const fn = vi.fn((x: number, y: number) => x + y);
    const debounced = useDebounceFn(fn, 100);

    debounced(2, 3);

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledWith(2, 3);
  });

  it('should only call once despite multiple rapid calls', async () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending call', async () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();
    (debounced as any).cancel();

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should flush pending call immediately', async () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();
    (debounced as any).flush();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should return last arguments when called multiple times', async () => {
    const fn = vi.fn((x: number) => x * 2);
    const debounced = useDebounceFn(fn, 100);

    debounced(1);
    debounced(5);

    await vi.advanceTimersByTimeAsync(100);
    expect(fn).toHaveBeenCalledWith(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should return a callable function', () => {
    const fn = vi.fn();
    const debounced = useDebounceFn(fn, 100);

    expect(typeof debounced).toBe('function');
  });
});
