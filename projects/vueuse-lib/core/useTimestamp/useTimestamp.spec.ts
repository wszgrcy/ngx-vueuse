import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useTimestamp } from './index';

// Mock requestAnimationFrame for testing
let mockTime = 0;
const pendingRafs: Map<number, FrameRequestCallback> = new Map();
let rafIdCounter = 0;

describe('useTimestamp', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
    mockTime = 0;
    rafIdCounter = 0;
    pendingRafs.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows for a delayed start using requestAnimationFrame', async () => {
    let now: number | undefined;
    const callback = vi.fn((time: number) => {
      now = time;
    });
    let result: any;
    let fakeTime = 1000;

    // Mock Date.now
    const dateNowSpy = vi.spyOn(globalThis.Date, 'now').mockImplementation(() => fakeTime);

    // Create a mock scheduler that calls the callback immediately when resume is called
    let scheduledCb: (() => void) | null = null;
    const mockPausable = {
      isActive: signal(false),
      pause: () => {},
      resume: () => {
        if (scheduledCb) {
          scheduledCb();
          mockPausable.isActive.set(true);
        }
      },
    };
    const scheduler = (cb: () => void) => {
      scheduledCb = cb;
      return mockPausable;
    };

    runInInjectionContext(injector, () => {
      result = useTimestamp({
        controls: true,
        immediate: false,

        callback,
        scheduler,
      });
    });

    const initial = result.timestamp();
    expect(result.timestamp()).toBe(1000);
    expect(now).toBeUndefined();

    // Resume should trigger the scheduled callback
    fakeTime = 2000;
    result.resume();

    // Verify callback was called
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(2000);
    expect(result.timestamp()).toBe(2000);
    expect(now).toBe(2000);

    dateNowSpy.mockRestore();
  });

  it('allows for a delayed start using common interval', async () => {
    let now: number | undefined;
    const callback = vi.fn((time: number) => {
      now = time;
    });
    let result: any;
    let fakeTime = 1000;

    const dateNowSpy = vi.spyOn(globalThis.Date, 'now').mockImplementation(() => fakeTime);

    // Create a mock scheduler that calls the callback immediately when resume is called
    let scheduledCb: (() => void) | null = null;
    const mockPausable = {
      isActive: signal(false),
      pause: () => {},
      resume: () => {
        if (scheduledCb) {
          scheduledCb();
          mockPausable.isActive.set(true);
        }
      },
    };
    const scheduler = (cb: () => void) => {
      scheduledCb = cb;
      return mockPausable;
    };

    runInInjectionContext(injector, () => {
      result = useTimestamp({
        controls: true,
        immediate: false,
        interval: 50,
        callback,
        scheduler,
      });
    });

    const initial = result.timestamp();
    expect(result.timestamp()).toBe(1000);
    expect(now).toBeUndefined();

    // Resume should trigger the scheduled callback
    fakeTime = 2000;
    result.resume();

    // Verify callback was called
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(2000);
    expect(result.timestamp()).toBe(2000);
    expect(now).toBe(2000);

    dateNowSpy.mockRestore();
  });
});
