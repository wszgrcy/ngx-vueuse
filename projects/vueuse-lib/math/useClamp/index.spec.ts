import { describe, expect, it, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { useClamp } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('useClamp', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useClamp).toBeDefined();
  });

  it('should be initial value', () => {
    runInInjectionContext(injector, () => {
      const v = useClamp(10, 0, 100);
      expect(v()).toBe(10);
    });
  });

  it('should clamp when min signal changes', () => {
    runInInjectionContext(injector, () => {
      const minSig = signal(20); // Start with min at 20
      const maxSig = signal(100);
      const v = useClamp(10, minSig, maxSig);

      // Should be clamped to min (20) immediately
      expect(v()).toBe(20);

      // Now change min to 30
      minSig.set(30);

      // Should be clamped to new min (30)
      expect(v()).toBe(30);
    });
  });

  it('should clamp when max signal changes', () => {
    runInInjectionContext(injector, () => {
      const minSig = signal(0);
      const maxSig = signal(100);
      const v = useClamp(50, minSig, maxSig);

      expect(v()).toBe(50);

      // Update max to 30 - should auto-clamp
      maxSig.set(30);
      expect(v()).toBe(30);
    });
  });

  it('should work with signal input', () => {
    runInInjectionContext(injector, () => {
      const baseSignal = signal(10);
      const v = useClamp(baseSignal, 0, 100);

      expect(v()).toBe(10);

      baseSignal.set(-10);
      expect(v()).toBe(0);

      baseSignal.set(110);
      expect(v()).toBe(100);
    });
  });

  it('should work with plain number input', () => {
    runInInjectionContext(injector, () => {
      const v = useClamp(50, 0, 100);

      expect(v()).toBe(50);
      expect(v()).toBe(50);
    });
  });

  it('should return readonly computed for signal input', () => {
    runInInjectionContext(injector, () => {
      const baseSignal = signal(50);
      const v = useClamp(baseSignal, 0, 100);

      // Signal input should return a read-only computed signal
      expect(v()).toBe(50);

      baseSignal.set(150);
      expect(v()).toBe(100);
    });
  });

  it('should clamp value when setting via .set() method', () => {
    runInInjectionContext(injector, () => {
      const v = useClamp(50, 0, 100);

      // Set value above max - should be clamped
      v.set(150);
      expect(v()).toBe(100);

      // Set value below min - should be clamped
      v.set(-10);
      expect(v()).toBe(0);

      // Set value within range - should be accepted
      v.set(75);
      expect(v()).toBe(75);
    });
  });
});
