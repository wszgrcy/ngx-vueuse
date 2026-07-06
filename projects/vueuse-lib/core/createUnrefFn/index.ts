import { toValue } from '@cyia/ngx-vueuse/shared';

type MaybeRef<T> = T | (() => T);

export type UnrefFn<T> = T extends (...args: infer A) => infer R
  ? (...args: { [K in keyof A]: MaybeRef<A[K]> }) => R
  : never;

/**
 * Make a plain function accepting ref and raw values as arguments.
 * Returns the same value the unconverted function returns, with proper typing.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createUnrefFn<T extends Function>(fn: T): UnrefFn<T> {
  return function (this: any, ...args: any[]) {
    return fn.apply(
      this,
      args.map((i) => toValue(i)),
    );
  } as unknown as UnrefFn<T>;
}
