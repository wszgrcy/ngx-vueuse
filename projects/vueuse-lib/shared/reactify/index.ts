import type { Signal, SignalOrValue, MaybeRef } from '../utils/types';
import type { AnyFn } from '../utils/types';
import { computed, isSignal } from '@angular/core';
import { toValue } from '../utils/general';

export type Reactified<T, Computed extends boolean> = T extends (...args: infer A) => infer R
  ? (
      ...args: { [K in keyof A]: Computed extends true ? SignalOrValue<A[K]> : MaybeRef<A[K]> }
    ) => Signal<R>
  : never;

export type ReactifyReturn<T extends AnyFn = AnyFn, K extends boolean = true> = Reactified<T, K>;

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
 * The converted function accepts refs as it's arguments
 * and returns a ComputedRef, with proper typing.
 *
 * @param fn - Source function
 * @param options - Options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function reactify<T extends AnyFn, K extends boolean = true>(
  fn: T,
  options?: ReactifyOptions<K>,
): ReactifyReturn<T, K> {
  const unrefFn =
    options?.computedGetter === false
      ? (v: any) => {
          if (isSignal(v)) return v();
          return v;
        }
      : toValue;
  return function (this: any, ...args: any[]) {
    return computed(() =>
      fn.apply(
        this,
        args.map((i) => unrefFn(i)),
      ),
    );
  } as ReactifyReturn<T, K>;
}

/** @deprecated use `reactify` instead */
export const createReactiveFn = reactify;
