import { inject } from '@angular/core';
import { DestroyRef } from '@angular/core';
import type { Fn } from '../utils/types';

/**
 * Call onDestroy() if it's inside a component lifecycle, if not, do nothing
 *
 * @param fn
 * @param failSilently
 */
export function tryOnScopeDispose(fn: Fn, failSilently?: boolean): boolean {
  try {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(fn);
    return true;
  } catch {
    if (!failSilently) {
      throw new Error('tryOnScopeDispose must be called in an injection context');
    }
    return false;
  }
}
