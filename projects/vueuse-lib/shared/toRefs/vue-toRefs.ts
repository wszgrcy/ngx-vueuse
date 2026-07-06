import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';

interface WritableComputedRef<T> {
  (): T;
  value: T;
}

/**
 * Convert a plain object or array to signals (read-only).
 * This mirrors Vue's toRefs behavior for non-ref objects.
 */
export function toRefs<T extends object>(
  obj: SignalOrValue<T>,
): { [K in keyof T]: WritableComputedRef<T[K]> } {
  const result: any = {};
  const resolved = obj as T;

  for (const key in resolved) {
    result[key] = computed(() => {
      const o = obj as T;
      return o[key];
    }) as any;
  }

  return result;
}
