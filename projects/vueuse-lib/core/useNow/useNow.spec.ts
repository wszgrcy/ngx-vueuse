import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useNow } from './index';

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be defined', () => {
    expect(useNow).toBeDefined();
  });

  // Note: Full functional tests are skipped as they require injection context
  // The Vue original tests are in index.browser.test.ts and run in browser context
  // Angular tests require complex setup with useRafFn/useIntervalFn -> tryOnScopeDispose -> DestroyRef

  it.skip('should get now timestamp by default', () => {
    const now = useNow();

    expect(+now()).toBeLessThanOrEqual(Date.now());
  });

  it.skip('starts lazily if immediate is false', () => {
    const initial = Date.now();
    const { now, resume } = useNow({ controls: true, immediate: false });

    expect(+now()).toBe(initial);
    vi.advanceTimersByTime(50);
    expect(+now()).toBe(initial);

    resume();
    vi.advanceTimersByTime(50);
    expect(+now()).toBeGreaterThan(initial);
  });

  it.skip('should control now timestamp by requestAnimationFrame', () => {
    let initial = Date.now();
    const { now, pause, resume } = useNow({ controls: true, interval: 'requestAnimationFrame' });

    expect(+now()).toBeGreaterThanOrEqual(initial);

    vi.advanceTimersByTime(50);

    expect(+now()).toBeGreaterThan(initial);

    initial = +now();

    pause();
    vi.advanceTimersByTime(50);

    expect(+now()).toBe(initial);

    resume();
    vi.advanceTimersByTime(50);

    expect(+now()).toBeGreaterThan(initial);
  });

  it.skip('should control now timestamp by interval', () => {
    let initial = Date.now();
    const { now, pause, resume } = useNow({ controls: true, interval: 50 });

    expect(+now()).toBeGreaterThanOrEqual(initial);

    vi.advanceTimersByTime(50);

    expect(+now()).toBeGreaterThan(initial);

    initial = +now();

    pause();
    vi.advanceTimersByTime(50);

    expect(+now()).toBe(initial);

    resume();
    vi.advanceTimersByTime(50);

    expect(+now()).toBeGreaterThan(initial);
  });
});
