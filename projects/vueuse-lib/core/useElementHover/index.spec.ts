import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useElementHover } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

let injector: ReturnType<typeof createInjector>;
let targetElement: HTMLElement;

describe('useElementHover', () => {
  beforeEach(() => {
    injector = createInjector();
    targetElement = document.createElement('div');
    targetElement.id = 'target';
    document.body.appendChild(targetElement);
  });

  afterEach(() => {
    injector.destroy();
    if (targetElement && targetElement.parentNode) {
      targetElement.parentNode.removeChild(targetElement);
    }
  });

  it('should be defined', () => {
    expect(useElementHover).toBeDefined();
  });

  it('should return a signal with initial value false', () => {
    runInInjectionContext(injector, () => {
      const isHovered = useElementHover(targetElement);
      expect(isHovered()).toBe(false);
    });
  });

  it('should set signal to true on mouseenter', () => {
    runInInjectionContext(injector, () => {
      const isHovered = useElementHover(targetElement);

      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
      });

      targetElement.dispatchEvent(mouseEnterEvent);

      expect(isHovered()).toBe(true);
    });
  });

  it('should set signal to false on mouseleave', () => {
    runInInjectionContext(injector, () => {
      const isHovered = useElementHover(targetElement);

      // First enter
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
      });
      targetElement.dispatchEvent(mouseEnterEvent);

      // Then leave
      const mouseLeaveEvent = new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
      });
      targetElement.dispatchEvent(mouseLeaveEvent);

      expect(isHovered()).toBe(false);
    });
  });

  it('should handle rapid hover enter/leave sequences', () => {
    runInInjectionContext(injector, () => {
      const isHovered = useElementHover(targetElement);

      for (let i = 0; i < 5; i++) {
        targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        targetElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      }

      // Should end in false (last state)
      expect(isHovered()).toBe(false);
    });
  });

  it('should support delayEnter option', () => {
    runInInjectionContext(injector, () => {
      const isHovered = useElementHover(targetElement, { delayEnter: 100, delayLeave: 0 });

      targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Should not be true immediately due to delay
      expect(isHovered()).toBe(false);

      // Wait for delay
      setTimeout(() => {
        expect(isHovered()).toBe(true);
      }, 150);
    });
  });

  it('should support delayLeave option', () => {
    runInInjectionContext(injector, () => {
      const isHovered = useElementHover(targetElement, { delayEnter: 0, delayLeave: 100 });

      // First enter
      targetElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      expect(isHovered()).toBe(true);

      // Then leave with delay
      targetElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      // Should still be true due to delay
      expect(isHovered()).toBe(true);

      // Wait for delay
      setTimeout(() => {
        expect(isHovered()).toBe(false);
      }, 150);
    });
  });
});
