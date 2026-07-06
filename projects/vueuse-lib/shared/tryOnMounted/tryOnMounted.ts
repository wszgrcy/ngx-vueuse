import type { Fn } from '../utils/types';
import { afterNextRender, DestroyRef, inject } from '@angular/core';

/**
 * Call afterNextRender() if it's inside a component lifecycle, if not, just call the function
 *
 * @param fn
 * @param sync if set to false, it will run in the next tick
 */
export function tryOnMounted(fn: Fn, sync = true): void {
  try {
    // Try to get DestroyRef to check if we're in an injection context
    const destroyRef = inject(DestroyRef);
    if (destroyRef) {
      // We're in an injection context (component/service)
      if (sync) {
        afterNextRender(() => {
          fn();
        });
      } else {
        // Schedule for next tick
        queueMicrotask(() => {
          fn();
        });
      }
    }
  } catch {
    // Not in injection context, just call the function
    if (sync) {
      fn();
    } else {
      queueMicrotask(() => {
        fn();
      });
    }
  }
}
