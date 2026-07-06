import type { Signal } from '../utils/types';
import { computed, type WritableSignal } from '@angular/core';

/**
 * Apply default value to a ref.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function refDefault<T>(source: Signal<T | undefined | null>, defaultValue: T): Signal<T> {
  return computed({
    get() {
      const v = source();
      return v ?? defaultValue;
    },
    set(value) {
      (source as WritableSignal<T | undefined | null>).set(value);
    },
  });
}
