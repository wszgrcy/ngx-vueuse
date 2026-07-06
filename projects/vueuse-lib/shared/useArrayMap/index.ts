import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

export type UseArrayMapReturn = ReturnType<typeof computed>;

/**
 * Reactive `Array.map`
 */
export function useArrayMap<T, U = T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  fn: (element: T, index: number, array: T[]) => U,
): UseArrayMapReturn {
  return computed(() => {
    const resolved = resolveAll<T>(toValue(list));
    return resolved.map(fn);
  });
}
