import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { useScrollLock } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

let injector: ReturnType<typeof createInjector>;

describe('useScrollLock', () => {
  beforeEach(() => {
    injector = createInjector();
  });

  afterEach(() => {
    injector.destroy();
  });

  it('should be defined', () => {
    expect(useScrollLock).toBeDefined();
  });

  it('should return a computed signal', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container);

      expect(result).toBeDefined();
      expect(typeof result()).toBe('boolean');
    });

    document.body.removeChild(container);
  });

  it('should start unlocked by default', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container);

      expect(result()).toBe(false);
      expect(container.style.overflow).toBe('');
    });

    document.body.removeChild(container);
  });

  it('should lock when initialState is true', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container, true);

      expect(result()).toBe(true);
      expect(container.style.overflow).toBe('hidden');
    });

    document.body.removeChild(container);
  });

  it('should lock the element when setting to true', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container);

      expect(result()).toBe(false);

      // Lock by calling with true
      result(true);

      expect(result()).toBe(true);
      expect(container.style.overflow).toBe('hidden');
    });

    document.body.removeChild(container);
  });

  it('should unlock the element when setting to false', () => {
    const container = document.createElement('div');
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container, true);

      expect(result()).toBe(true);

      // Unlock by calling with false
      result(false);

      expect(result()).toBe(false);
      expect(container.style.overflow).toBe('');
    });

    document.body.removeChild(container);
  });

  it('should handle signal element', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const elementSignal = signal(container);
      const result = useScrollLock(elementSignal);

      expect(result).toBeDefined();
      expect(typeof result()).toBe('boolean');
    });

    document.body.removeChild(container);
  });

  it('should handle null element', () => {
    runInInjectionContext(injector, () => {
      const result = useScrollLock(null);

      expect(result).toBeDefined();
      expect(result()).toBe(false);
    });
  });

  it('should handle undefined element', () => {
    runInInjectionContext(injector, () => {
      const result = useScrollLock(undefined);

      expect(result).toBeDefined();
      expect(result()).toBe(false);
    });
  });

  it('should handle getter function element', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const elementGetter = () => container;
      const result = useScrollLock(elementGetter);

      expect(result).toBeDefined();
      expect(typeof result()).toBe('boolean');
    });

    document.body.removeChild(container);
  });

  it('should preserve initial overflow value', () => {
    const container = document.createElement('div');
    container.style.overflow = 'auto';
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container, true);

      expect(result()).toBe(true);
      expect(container.style.overflow).toBe('hidden');

      // Unlock should restore to 'auto'
      result(false);
      expect(container.style.overflow).toBe('auto');
    });

    document.body.removeChild(container);
  });

  it('should not lock again if already locked', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container, true);

      expect(result()).toBe(true);

      // Try to lock again
      result(true);

      expect(result()).toBe(true);
      expect(container.style.overflow).toBe('hidden');
    });

    document.body.removeChild(container);
  });

  it('should handle elements with overflow: hidden initially', () => {
    const container = document.createElement('div');
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    runInInjectionContext(injector, () => {
      const result = useScrollLock(container);

      // Should be locked automatically
      expect(result()).toBe(true);
    });

    document.body.removeChild(container);
  });

  it('should work with Document element', () => {
    runInInjectionContext(injector, () => {
      // Use document.documentElement instead of document directly,
      // as document.style is undefined but document.documentElement.style exists
      const result = useScrollLock(document.documentElement);

      expect(result).toBeDefined();
      expect(typeof result()).toBe('boolean');
    });
  });
});
