import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

export type UseArrayFindReturn<T = any> = ReturnType<typeof computed>;

/**
 * Reactive `Array.find`
 *
 * @breaking Change from VueUse: The `array` parameter in the callback is now `T[]` (resolved)
 * instead of `MaybeRefOrGetter<T>[]`. This is because the array is already resolved
 * by `resolveAll()` before being passed to the callback. This is actually a more
 * sensible type, but may require updates to existing callback implementations.
 */
export function useArrayFind<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  fn: (element: T, index: number, array: T[]) => boolean,
): UseArrayFindReturn<T> {
  return computed(() => {
    const resolved = resolveAll<T>(toValue(list));
    return resolved.find(fn);
  });
}
