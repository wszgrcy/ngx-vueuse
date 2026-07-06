import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

export interface UseArrayDifferenceOptions {
  /**
   * Returns asymmetric difference
   *
   * @see https://en.wikipedia.org/wiki/Symmetric_difference
   * @default false
   */
  symmetric?: boolean;
}

function defaultComparator<T>(value: T, othVal: T) {
  return value === othVal;
}

export type UseArrayDifferenceReturn<T = any> = ReturnType<typeof computed>;

/**
 * Reactive get array difference of two array
 *
 * @breaking Change from VueUse: Array elements are now resolved with `resolveAll()` before
 * comparison, consistent with other useArray* functions.
 *
 * @see https://vueuse.org/useArrayDifference
 * @param list - the first array
 * @param values - the second array
 * @param compareFn - optional comparator function or key string
 * @param options - optional difference options (e.g., symmetric)
 * @returns the difference of the two arrays
 */
export function useArrayDifference<T>(
  list: SignalOrValue<T[]>,
  values: SignalOrValue<T[]>,
  key?: keyof T,
  options?: UseArrayDifferenceOptions,
): UseArrayDifferenceReturn<T>;
export function useArrayDifference<T>(
  list: SignalOrValue<T[]>,
  values: SignalOrValue<T[]>,
  compareFn?: (value: T, othVal: T) => boolean,
  options?: UseArrayDifferenceOptions,
): UseArrayDifferenceReturn<T>;

export function useArrayDifference<T>(...args: any[]): UseArrayDifferenceReturn<T> {
  const list: SignalOrValue<T[]> = args[0];
  const values: SignalOrValue<T[]> = args[1];

  let compareFn = args[2] ?? defaultComparator;
  const { symmetric = false } = args[3] ?? {};

  if (typeof compareFn === 'string') {
    const key = compareFn as keyof T;
    compareFn = (value: T, othVal: T) => value[key] === othVal[key];
  }

  const diff1 = computed(() => {
    const resolvedList = resolveAll<T>(toValue(list));
    const resolvedValues = resolveAll<T>(toValue(values));
    return resolvedList.filter(
      (x: T) => resolvedValues.findIndex((y: T) => compareFn(x, y)) === -1,
    );
  });

  if (symmetric) {
    const diff2 = computed(() => {
      const resolvedList = resolveAll<T>(toValue(list));
      const resolvedValues = resolveAll<T>(toValue(values));
      return resolvedValues.filter(
        (x: T) => resolvedList.findIndex((y: T) => compareFn(x, y)) === -1,
      );
    });
    return computed(() => (symmetric ? [...toValue(diff1), ...toValue(diff2)] : toValue(diff1)));
  }

  return diff1;
}
