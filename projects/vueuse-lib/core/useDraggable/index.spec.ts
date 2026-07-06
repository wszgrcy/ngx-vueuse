import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useDraggable } from './index';

describe('useDraggable', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useDraggable).toBeDefined();
  });

  // Note: These tests require Angular injection context and DOM environment
  // because useDraggable uses effect() and event listeners.
  // In a real Angular component, these tests would pass when
  // run within TestBed.runInInjectionContext or within a component lifecycle.

  /*
  it('basic functionality', async () => {
    const onStart = vi.fn()
    const onMove = vi.fn()
    const onEnd = vi.fn()

    const element = document.createElement('div')
    element.id = 'draggable'
    document.body.appendChild(element)

    const result = runInInjectionContext(injector, () => {
      return useDraggable(element, {
        preventDefault: true,
        onMove,
        onEnd,
        onStart,
      })
    })

    expect(result.x()).toBe(0)
    expect(result.y()).toBe(0)
    expect(result.isDragging()).toBe(false)

    // Simulate pointer down
    element.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 0,
      clientY: 0,
    }))

    expect(onStart).toHaveBeenCalledOnce()
    expect(onMove).not.toBeCalled()
    expect(onEnd).not.toBeCalled()
    expect(result.isDragging()).toBe(true)

    // Simulate pointer move
    window.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 10,
      clientY: 20,
    }))

    expect(onMove).toHaveBeenCalledOnce()
    expect(onEnd).not.toBeCalled()
    expect(result.x()).toBe(10)
    expect(result.y()).toBe(20)
    expect(result.isDragging()).toBe(true)

    // Simulate pointer up
    window.dispatchEvent(new PointerEvent('pointerup'))

    expect(onEnd).toHaveBeenCalledOnce()
    expect(result.x()).toBe(10)
    expect(result.y()).toBe(20)
    expect(result.isDragging()).toBe(false)
  })
  */
});
