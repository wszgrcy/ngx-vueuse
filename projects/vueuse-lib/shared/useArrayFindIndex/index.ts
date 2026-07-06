import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

export type UseArrayFindIndexReturn = ReturnType<typeof computed>;

/**
 * Reactive `Array.findIndex`
 */
export function useArrayFindIndex<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  fn: (element: T, index: number, array: T[]) => boolean,
): UseArrayFindIndexReturn {
  return computed(() => {
    const resolved = resolveAll<T>(toValue(list));
    return resolved.findIndex(fn);
  });
}
