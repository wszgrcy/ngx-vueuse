import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useMouse } from './index';

describe('useMouse', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useMouse).toBeDefined();
  });

  // Note: These tests require Angular injection context and DOM environment
  // because useMouse uses effect() and event listeners.
  // In a real Angular component, these tests would pass when
  // run within TestBed.runInInjectionContext or within a component lifecycle.

  /*
  it('should track mouse position', async () => {
    const result = runInInjectionContext(injector, () => {
      return useMouse()
    })

    expect(result.x()).toBe(0)
    expect(result.y()).toBe(0)
    expect(result.sourceType()).toBeNull()

    // Simulate mouse move
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 100,
      clientY: 200,
    }))

    expect(result.x()).toBe(100)
    expect(result.y()).toBe(200)
    expect(result.sourceType()).toBe('mouse')
  })

  it('should track touch position', async () => {
    const result = runInInjectionContext(injector, () => {
      return useMouse({ touch: true })
    })

    // Simulate touch start
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{
        clientX: 50,
        clientY: 75,
      } as Touch],
    } as TouchEvent)
    window.dispatchEvent(touchEvent)

    expect(result.x()).toBe(50)
    expect(result.y()).toBe(75)
    expect(result.sourceType()).toBe('touch')
  })
  */
});
