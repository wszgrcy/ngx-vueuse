import type { Fn } from '../utils/types';
import { inject, EnvironmentInjector, DestroyRef } from '@angular/core';

/**
 * Call onDestroy() if it's inside a component lifecycle, if not, do nothing
 *
 * @param fn
 * @param target
 */
export function tryOnUnmounted(fn: Fn, target?: EnvironmentInjector | null) {
  const injector = target || inject(EnvironmentInjector, { optional: true });
  if (injector) {
    const destroyRef = injector.get(DestroyRef, null);
    if (destroyRef) {
      destroyRef.onDestroy(fn);
    }
  }
}
