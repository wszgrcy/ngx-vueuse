import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

function findLast<T>(
  arr: T[],
  cb: (element: T, index: number, array: T[]) => boolean,
): T | undefined {
  let index = arr.length;
  while (index-- > 0) {
    if (cb(arr[index], index, arr)) return arr[index];
  }
  return undefined;
}

export type UseArrayFindLastReturn<T = any> = ReturnType<typeof computed>;

/**
 * Reactive `Array.findLast`
 *
 * @breaking Change from VueUse: The `array` parameter in the callback is now `T[]` (resolved)
 * instead of `MaybeRefOrGetter<T>[]`. This is because the array is already resolved
 * by `resolveAll()` before being passed to the callback. This is actually a more
 * sensible type, but may require updates to existing callback implementations.
 *
 * @see https://vueuse.org/useArrayFindLast
 * @param list - the array was called upon.
 * @param fn - a function to test each element.
 *
 * @returns the last element in the array that satisfies the provided testing function. Otherwise, undefined is returned.
 */
export function useArrayFindLast<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  fn: (element: T, index: number, array: T[]) => boolean,
): UseArrayFindLastReturn<T> {
  return computed(() => {
    const resolved = resolveAll<T>(toValue(list));
    return toValue<T | undefined>(
      !Array.prototype.findLast ? findLast(resolved, fn) : resolved.findLast(fn),
    );
  });
}
