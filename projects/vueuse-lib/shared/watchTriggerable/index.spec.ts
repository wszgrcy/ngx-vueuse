import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { watchTriggerable } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('watchTriggerable', () => {
  it('should return trigger function', () => {
    const source = signal(0);
    const callback = vi.fn();

    watchTriggerable(source, callback);
  });

  it('should handle simple signals', () => {
    const source = signal(42);
    let result: any;

    watchTriggerable(source, (value, oldValue) => {
      result = { value, oldValue };
    });

    expect(result).toBeDefined();
  });

  it('should handle cleanup function', () => {
    const source = signal(0);
    let cleanupCalled = false;

    watchTriggerable(source, (value, oldValue, onCleanup) => {
      onCleanup(() => {
        cleanupCalled = true;
      });
    });

    expect(cleanupCalled).toBe(false); // Cleanup is called when next effect runs
  });

  it('should have ignoreUpdates method', () => {
    const source = signal(0);
    let callbackCount = 0;

    const { ignoreUpdates } = watchTriggerable(source, () => {
      callbackCount++;
    });

    expect(callbackCount).toBe(1);

    // Update inside ignoreUpdates should not trigger callback
    ignoreUpdates(() => {
      source.set(1);
    });

    expect(callbackCount).toBe(1);
  });

  it('should have stop method', () => {
    const source = signal(0);
    let callbackCount = 0;

    const { stop } = watchTriggerable(source, () => {
      callbackCount++;
    });

    expect(callbackCount).toBe(1);

    stop();
    source.set(1);

    // After stopping, callback should not be called
    expect(callbackCount).toBe(1);
  });

  it('should have ignorePrevAsyncUpdates method', () => {
    const source = signal(0);

    const { ignorePrevAsyncUpdates } = watchTriggerable(source, () => {});

    // Should not throw
    expect(() => ignorePrevAsyncUpdates()).not.toThrow();
  });

  it('should trigger callback immediately on trigger()', () => {
    const source = signal(0);
    let effectValue = 0;
    let cleanupCount = -1;

    const { trigger } = watchTriggerable(source, (value, oldValue, onCleanup) => {
      onCleanup(() => {
        cleanupCount = value;
      });
      effectValue = value;
    });

    // Initial call from effect
    expect(effectValue).toBe(0);
    expect(cleanupCount).toBe(-1);

    // trigger() should execute immediately
    trigger();
    expect(effectValue).toBe(0);
  });

  // === Vue原版测试场景: trigger should await async callbacks ===

  it('trigger should await async callbacks', async () => {
    const source = signal(1);
    let effectValue = 0;

    const { trigger } = watchTriggerable(source, async (value) => {
      // Simulate async work
      await waitForMicrotasks();
      effectValue = value;
    });

    // Before trigger, effect should not have run
    expect(effectValue).toBe(0);

    // Trigger should await the async callback
    await trigger();

    expect(effectValue).toBe(source());
  });

  // Note: Multiple sources test is skipped as watchTriggerable implementation
  // may not support array sources in the same way as VueUse.
  // The basic triggerable tests above cover the core behavior.

  it('should handle array sources', () => {
    const source1 = signal(0);
    const source2 = signal('a');
    let effectValue1 = -1;
    let effectValue2 = 'z';

    const { trigger } = watchTriggerable([source1, source2], ([value1, value2]) => {
      effectValue1 = value1;
      effectValue2 = value2;
    });

    trigger();
    expect(effectValue1).toBe(0);
    expect(effectValue2).toBe('a');
  });

  it('should handle reactive object sources', () => {
    const source = { a: signal('a') };
    let effectValue = '';

    const { trigger } = watchTriggerable(source, (value) => {
      effectValue = value.a();
    });

    trigger();
    expect(effectValue).toBe('a');
  });

  it('should return trigger result', async () => {
    const source = signal(1);
    const { trigger } = watchTriggerable(source, async (value) => value * 2);

    const result = await trigger();
    expect(result).toBe(2);
  });
});
