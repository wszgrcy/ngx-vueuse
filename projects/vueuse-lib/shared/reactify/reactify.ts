import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { Fn } from '../utils/types';
import { toValue } from '../utils/general';

export type Reactified<T, Computed extends boolean> = T extends (...args: infer A) => infer R
  ? (
      ...args: { [K in keyof A]: Computed extends true ? Signal<A[K]> | A[K] | (() => A[K]) : A[K] }
    ) => Signal<R>
  : never;

export type ReactifyReturn<T extends Fn = Fn, K extends boolean = true> = Reactified<T, K>;

export interface ReactifyOptions<T extends boolean> {
  /**
   * Accept passing a function as a reactive getter
   *
   * @default true
   */
  computedGetter?: T;
}

/**
 * Converts plain function into a reactive function.
 * The converted function accepts signals as it's arguments
 * and returns a Signal, with proper typing.
 *
 * @param fn - Source function
 * @param options - Options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function reactify<T extends (...args: any[]) => any, K extends boolean = true>(
  fn: T,
  options?: ReactifyOptions<K>,
): ReactifyReturn<T, K> {
  const unrefFn =
    options?.computedGetter === false
      ? (x: any) => (typeof x === 'function' ? (x as () => any)() : x)
      : toValue;
  return function (this: any, ...args: any[]) {
    return computed(() =>
      fn.apply(
        this,
        args.map((i) => unrefFn(i)),
      ),
    );
  } as any;
}

/** @deprecated use `reactify` instead */
export const createReactiveFn = reactify;
