import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useMousePressed } from './index';

describe('useMousePressed', () => {
  let injector: ReturnType<typeof createInjector>;
  let currentResult: ReturnType<typeof useMousePressed> | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    injector = createInjector();
    currentResult = undefined;
  });

  it('should be defined', () => {
    expect(useMousePressed).toBeDefined();
  });

  it('should return pressed and sourceType signals', () => {
    const result = runInInjectionContext(injector, () => useMousePressed());
    currentResult = result;

    expect(result.pressed()).toBe(false);
    expect(result.sourceType()).toBeNull();
  });

  it('should track mouse press state', () => {
    const result = runInInjectionContext(injector, () => useMousePressed());
    currentResult = result;

    expect(result.pressed()).toBe(false);
    expect(result.sourceType()).toBeNull();

    // Simulate mousedown
    window.dispatchEvent(
      new MouseEvent('mousedown', {
        clientX: 0,
        clientY: 0,
      }),
    );

    expect(result.pressed()).toBe(true);
    expect(result.sourceType()).toBe('mouse');

    // Simulate mouseup
    window.dispatchEvent(new MouseEvent('mouseup'));

    expect(result.pressed()).toBe(false);
    expect(result.sourceType()).toBeNull();
  });

  it('should respect drag option', () => {
    const result = runInInjectionContext(injector, () => useMousePressed({ drag: false }));
    currentResult = result;

    // Simulate dragstart - should not trigger pressed state
    // Note: jsdom doesn't support DragEvent, so we skip this assertion
    try {
      window.dispatchEvent(new DragEvent('dragstart'));
    } catch {
      // DragEvent not available in jsdom
    }

    expect(result.pressed()).toBe(false);
    expect(result.sourceType()).toBeNull();
  });

  it('should use initialValue', () => {
    const result = runInInjectionContext(injector, () => useMousePressed({ initialValue: true }));
    currentResult = result;

    expect(result.pressed()).toBe(true);
  });

  it('should call onPressed callback', () => {
    const onPressed = vi.fn();
    const onReleased = vi.fn();

    const result = runInInjectionContext(injector, () =>
      useMousePressed({ onPressed, onReleased }),
    );
    currentResult = result;

    window.dispatchEvent(new MouseEvent('mousedown'));

    expect(onPressed).toHaveBeenCalledTimes(1);
    expect(onPressed).toHaveBeenCalledWith(expect.any(MouseEvent));

    window.dispatchEvent(new MouseEvent('mouseup'));

    expect(onReleased).toHaveBeenCalledTimes(1);
    expect(onReleased).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  it('should return signals even when window is undefined', () => {
    const result = runInInjectionContext(injector, () =>
      useMousePressed({ window: undefined as any }),
    );

    expect(result.pressed()).toBe(false);
    expect(result.sourceType()).toBeNull();
  });
});
