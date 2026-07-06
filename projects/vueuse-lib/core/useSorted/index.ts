import { computed, type Signal, effect } from '@angular/core';
import type { MaybeRefOrGetter, SignalOrValue } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';

export type UseSortedCompareFn<T = any> = (a: T, b: T) => number;

export type UseSortedFn<T = any> = (arr: T[], compareFn: UseSortedCompareFn<T>) => T[];

export interface UseSortedOptions<T = any> {
  /**
   * sort algorithm
   */
  sortFn?: UseSortedFn<T>;
  /**
   * compare function
   */
  compareFn?: UseSortedCompareFn<T>;
  /**
   * change the value of the source array
   * @default false
   */
  dirty?: boolean;
}

const defaultSortFn: UseSortedFn = <T>(source: T[], compareFn: UseSortedCompareFn<T>): T[] =>
  source.sort(compareFn);
const defaultCompare: UseSortedCompareFn<number> = (a, b) => a - b;

/**
 * reactive sort array
 *
 * @see https://vueuse.org/useSorted
 */
export function useSorted<T = unknown>(
  source: SignalOrValue<T[]> | T[],
  compareFnOrOptions?: UseSortedCompareFn<T> | UseSortedOptions<T>,
  options?: UseSortedOptions<T>,
): Signal<T[]> {
  let compareFn: UseSortedCompareFn<T> = defaultCompare as UseSortedCompareFn<T>;
  let sortedOptions: UseSortedOptions<T> = {};

  // Handle different argument patterns like Vue version
  if (arguments.length === 2) {
    if (typeof compareFnOrOptions === 'object') {
      sortedOptions = compareFnOrOptions as UseSortedOptions<T>;
      compareFn = sortedOptions.compareFn ?? (defaultCompare as UseSortedCompareFn<T>);
    } else {
      compareFn = compareFnOrOptions as UseSortedCompareFn<T>;
    }
  } else if (arguments.length > 2) {
    compareFn = compareFnOrOptions as UseSortedCompareFn<T>;
    sortedOptions = options ?? {};
  }
  // else: arguments.length === 1, compareFn remains defaultCompare

  const { dirty = false, sortFn = defaultSortFn } = sortedOptions;

  if (!dirty)
    return computed(() => sortFn([...toValue(source as MaybeRefOrGetter<T[]>)], compareFn));

  // dirty mode - directly modify source array

  const sourceArr = toValue(source as MaybeRefOrGetter<T[]>) as any;
  // For dirty mode, use effect to sort immediately and keep in sync
  effect(() => {
    sortFn(toValue(source as MaybeRefOrGetter<T[]>) as any, compareFn);
  });

  return computed(() => sourceArr);
}
