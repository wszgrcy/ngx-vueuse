import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

function uniq<T>(array: T[]) {
  return Array.from(new Set(array));
}

function uniqueElementsBy<T>(array: T[], fn: (a: T, b: T, array: T[]) => boolean) {
  return array.reduce<T[]>((acc, v) => {
    if (!acc.some((x) => fn(v, x, array))) acc.push(v);
    return acc;
  }, []);
}
export type UseArrayUniqueReturn = ReturnType<typeof computed>;

/**
 * Reactive `Array` unique values
 */
export function useArrayUnique<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  compareFn?: (a: T, b: T, array: T[]) => boolean,
): UseArrayUniqueReturn {
  return computed(() => {
    const resolvedList = resolveAll<T>(toValue(list));
    return compareFn ? uniqueElementsBy(resolvedList, compareFn) : uniq(resolvedList);
  });
}
