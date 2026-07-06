import { toValue } from '../utils/general';
import { reactiveComputed } from '../reactiveComputed/reactiveComputed';
import { toRef } from '../toRef';

export type ReactivePickReturn<T extends object, K extends keyof T> = { [S in K]: T[S] };

export type ReactivePickPredicate<T> = (value: T[keyof T], key: keyof T) => boolean;

export function reactivePick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: (K | K[])[]
): ReactivePickReturn<T, K>;
export function reactivePick<T extends object>(
  obj: T,
  predicate: ReactivePickPredicate<T>,
): ReactivePickReturn<T, keyof T>;

/**
 * Reactively pick fields from a reactive object
 *
 * @see https://vueuse.org/reactivePick
 */
export function reactivePick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: (K | K[])[]
): { [S in K]: T[S] } {
  const flatKeys = keys.flat() as K[];
  const predicate = flatKeys[0] as unknown as ReactivePickPredicate<T>;
  return reactiveComputed(() => {
    const entries = Object.entries(obj);
    return Object.fromEntries(
      typeof predicate === 'function'
        ? entries.filter(([k, v]) => predicate(toValue(v) as T[K], k as K))
        : flatKeys.map((k) => [k, toRef(obj, k)]),
    );
  }) as any;
}
