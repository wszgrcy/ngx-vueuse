import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

export type UseArrayFilterReturn<T = any> = ReturnType<typeof computed>;

/**
 * Reactive `Array.filter`
 *
 * Supports TypeScript type guard for type narrowing:
 * ```ts
 * const filtered = useArrayFilter(list, (item): item is MyType => ...)
 * ```
 */
export function useArrayFilter<T, S extends T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  fn: (element: T, index: number, array: T[]) => element is S,
): UseArrayFilterReturn<S>;
export function useArrayFilter<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  fn: (element: T, index: number, array: T[]) => boolean,
): UseArrayFilterReturn<T>;
export function useArrayFilter<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  fn: (element: T, index: number, array: T[]) => boolean,
): UseArrayFilterReturn<T> {
  return computed(() => {
    const resolved = resolveAll<T>(toValue(list));
    return resolved.filter(fn);
  });
}
