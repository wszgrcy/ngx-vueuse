import type { Signal } from '@angular/core';
import { computed } from '@angular/core';

/**
 * Apply default value to a signal.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function refDefault<T>(source: Signal<T | undefined | null>, defaultValue: T): Signal<T> {
  return computed(() => source() ?? defaultValue);
}
