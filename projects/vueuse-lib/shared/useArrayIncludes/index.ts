import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { toValue } from '../utils/general';
import { isObject } from '../utils/is';

export type UseArrayIncludesComparatorFn<T, V> = (
  element: T,
  value: V,
  index: number,
  array: SignalOrValue<T>[],
) => boolean;

function containsProp(obj: any, ...props: string[]) {
  return props.some((p) => p in obj);
}

function isArrayIncludesOptions<T, V>(obj: any): obj is UseArrayIncludesOptions<T, V> {
  return isObject(obj) && containsProp(obj, 'fromIndex', 'comparator');
}

export interface UseArrayIncludesOptions<T, V> {
  fromIndex?: number;
  comparator?: UseArrayIncludesComparatorFn<T, V> | keyof T;
}

export type UseArrayIncludesReturn = ReturnType<typeof computed>;

export function useArrayIncludes<T, V = any>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  value: SignalOrValue<V>,
  fromIndex?: number,
): UseArrayIncludesReturn;

export function useArrayIncludes<T, V = any>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  value: SignalOrValue<V>,
  comparator?: UseArrayIncludesComparatorFn<T, V>,
): UseArrayIncludesReturn;

export function useArrayIncludes<T, V = any>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  value: SignalOrValue<V>,
  comparator?: keyof T,
): UseArrayIncludesReturn;

export function useArrayIncludes<T, V = any>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  value: SignalOrValue<V>,
  options?: UseArrayIncludesOptions<T, V>,
): UseArrayIncludesReturn;

/**
 * Reactive `Array.includes`
 *
 * @see https://vueuse.org/useArrayIncludes
 *
 * @returns true if the `value` is found in the array. Otherwise, false.
 */
export function useArrayIncludes<T, V = any>(...args: any[]): UseArrayIncludesReturn {
  const list: SignalOrValue<SignalOrValue<T>[]> = args[0];
  const value: SignalOrValue<V> = args[1];

  let fromIndex = 0;
  let comparatorOption: UseArrayIncludesComparatorFn<T, V> | keyof T | number | undefined = args[2];

  // Handle fromIndex as number (first overload)
  if (typeof comparatorOption === 'number') {
    fromIndex = comparatorOption;
    comparatorOption = undefined;
  }

  if (isArrayIncludesOptions(comparatorOption)) {
    fromIndex = comparatorOption.fromIndex ?? 0;
    comparatorOption = comparatorOption.comparator;
  }

  let comparator: UseArrayIncludesComparatorFn<T, V>;
  if (typeof comparatorOption === 'string') {
    const key = comparatorOption as keyof T;
    comparator = ((element: T, value: V) =>
      element[key] === toValue(value)) as UseArrayIncludesComparatorFn<T, V>;
  } else if (typeof comparatorOption === 'function') {
    comparator = comparatorOption;
  } else {
    comparator = ((element: T, value: V) =>
      (element as any) === toValue(value)) as UseArrayIncludesComparatorFn<T, V>;
  }

  return computed(() =>
    toValue(list)
      .slice(fromIndex)
      .some((element, index, array) =>
        comparator(toValue(element), toValue(value), index, toValue(array)),
      ),
  );
}
