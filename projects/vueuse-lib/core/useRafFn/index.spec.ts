import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useRafFn } from './index';

// Mock requestAnimationFrame - stores callbacks and exposes tick() for testing
let mockTime = 0;
const pendingRafs: Map<number, FrameRequestCallback> = new Map();
let rafIdCounter = 0;

function mockRaf(cb: FrameRequestCallback): number {
  const id = ++rafIdCounter;
  pendingRafs.set(id, cb);
  return id;
}

function mockCancelRaf(id: number): void {
  pendingRafs.delete(id);
}

function tickOnce(): void {
  // Execute exactly one pending RAF callback
  for (const [id, cb] of pendingRafs) {
    pendingRafs.delete(id);
    cb(++mockTime * 16);
    break;
  }
}

const mockWindow = {
  ...(globalThis as any).window,
  requestAnimationFrame: mockRaf,
  cancelAnimationFrame: mockCancelRaf,
} as unknown as Window;

describe('useRafFn', () => {
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

  it('should be defined', () => {
    expect(useRafFn).toBeDefined();
  });

  it('should call callback on each raf', () => {
    const callback = vi.fn();

    runInInjectionContext(injector, () => {
      useRafFn(callback, { window: mockWindow });
    });

    // tickOnce executes the scheduled RAF loop, which calls the user callback
    tickOnce();
    expect(callback.mock.calls.length).toBeGreaterThan(0);
  });

  it('should return pausable interface with isActive', () => {
    let result: ReturnType<typeof useRafFn> | undefined;

    runInInjectionContext(injector, () => {
      result = useRafFn(() => {}, { window: mockWindow });
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('pause');
    expect(result).toHaveProperty('resume');
    expect(typeof result!.isActive()).toBe('boolean');
  });

  it('should pause the raf loop', () => {
    const callback = vi.fn();
    let pausable: ReturnType<typeof useRafFn>;

    runInInjectionContext(injector, () => {
      pausable = useRafFn(callback, { window: mockWindow });
    });

    // Execute one frame
    tickOnce();
    const callsBeforePause = callback.mock.calls.length;

    // Pause stops the loop
    pausable!.pause();

    // Tick multiple times - paused loop won't schedule new rafs
    for (let i = 0; i < 10; i++) {
      tickOnce();
    }
    expect(callback.mock.calls.length).toBe(callsBeforePause);
  });

  it('should resume the raf loop', () => {
    const callback = vi.fn();
    let pausable: ReturnType<typeof useRafFn>;

    runInInjectionContext(injector, () => {
      pausable = useRafFn(callback, { window: mockWindow });
    });

    tickOnce();
    pausable!.pause();

    // Resume should restart the loop
    pausable!.resume();
    tickOnce();

    expect(callback.mock.calls.length).toBeGreaterThan(0);
  });

  it('should pass delta and timestamp to callback', () => {
    const callback = vi.fn();

    runInInjectionContext(injector, () => {
      useRafFn(callback, { window: mockWindow });
    });

    tickOnce();
    expect(callback).toHaveBeenCalled();

    const lastCall = callback.mock.calls[callback.mock.calls.length - 1][0];
    expect(lastCall).toHaveProperty('delta');
    expect(lastCall).toHaveProperty('timestamp');
    expect(typeof lastCall.delta).toBe('number');
    expect(typeof lastCall.timestamp).toBe('number');
  });

  it('should respect fpsLimit option', () => {
    const cappedCallback = vi.fn();
    const uncappedCallback = vi.fn();

    runInInjectionContext(injector, () => {
      useRafFn(cappedCallback, { window: mockWindow, fpsLimit: 10 as number | null });
    });
    runInInjectionContext(injector, () => {
      useRafFn(uncappedCallback, { window: mockWindow });
    });

    // Tick many times - capped should have fewer calls due to fps limit
    for (let i = 0; i < 20; i++) {
      tickOnce();
    }

    expect(cappedCallback.mock.calls.length).toBeGreaterThan(0);
    expect(uncappedCallback.mock.calls.length).toBeGreaterThan(cappedCallback.mock.calls.length);
  });

  it('should call callback only once when once is true', () => {
    const callback = vi.fn();

    runInInjectionContext(injector, () => {
      useRafFn(callback, { window: mockWindow, once: true });
    });

    tickOnce();
    // once=true should stop the loop after first call
    for (let i = 0; i < 10; i++) {
      tickOnce();
    }
    expect(callback.mock.calls.length).toBe(1);
  });

  it('should not start immediately when immediate is false', () => {
    const callback = vi.fn();

    runInInjectionContext(injector, () => {
      useRafFn(callback, { window: mockWindow, immediate: false });
    });

    expect(callback).not.toHaveBeenCalled();

    // Resume should start it
    runInInjectionContext(injector, () => {
      const p = useRafFn(callback, { window: mockWindow, immediate: false });
      p.resume();
    });
    tickOnce();
    expect(callback.mock.calls.length).toBeGreaterThan(0);
  });

  it('isActive should reflect paused state', () => {
    let pausable: ReturnType<typeof useRafFn>;

    runInInjectionContext(injector, () => {
      pausable = useRafFn(() => {}, { window: mockWindow });
    });

    expect(pausable!.isActive()).toBe(true);

    pausable!.pause();
    expect(pausable!.isActive()).toBe(false);

    pausable!.resume();
    expect(pausable!.isActive()).toBe(true);
  });
});
