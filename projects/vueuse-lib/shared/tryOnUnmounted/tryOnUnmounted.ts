import type { Fn } from '../utils/types';
import { DestroyRef, inject } from '@angular/core';

/**
 * Call onDestroy() if it's inside a component lifecycle, if not, do nothing
 *
 * @param fn
 */
export function tryOnUnmounted(fn: Fn): void {
  try {
    // Try to get DestroyRef to check if we're in an injection context
    const destroyRef = inject(DestroyRef);
    if (destroyRef) {
      // We're in an injection context (component/service)
      destroyRef.onDestroy(fn);
    }
  } catch {
    // Not in injection context, do nothing
  }
}
