import { computed } from '@angular/core';
import type { SignalOrGetter, SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

export type UseArrayReducer<PV, CV, R> = (
  previousValue: PV,
  currentValue: CV,
  currentIndex: number,
) => R;

export type UseArrayReduceReturn<T = any> = ReturnType<typeof computed>;

export function useArrayReduce<T, U>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  reducer: UseArrayReducer<U, T, U>,
  initialValue: SignalOrGetter<U>,
): UseArrayReduceReturn<U>;

export function useArrayReduce<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  reducer: UseArrayReducer<T, T, T>,
): UseArrayReduceReturn<T>;

/**
 * Reactive `Array.reduce`
 *
 * @breaking Change from VueUse: The array elements are now resolved with `resolveAll()` before
 * being passed to the reducer callback. This means individual Signal elements are automatically
 * unwrapped, consistent with other useArray* functions.
 *
 * @see https://vueuse.org/useArrayReduce
 * @param list - the array was called upon.
 * @param reducer - a "reducer" function.
 * @param args - optional initial value for the reduction
 *
 * @returns the value that results from running the "reducer" callback function to completion over the entire array.
 */
export function useArrayReduce<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  reducer: (...p: any[]) => any,
  ...args: any[]
): UseArrayReduceReturn<T> {
  const reduceCallback = (sum: any, value: any, index: number) =>
    reducer(toValue(sum), toValue(value), index);

  return computed(() => {
    const resolved = resolveAll<T>(toValue(list));
    // Depending on the behavior of reduce, undefined is also a valid initialization value,
    // and this code will distinguish the behavior between them.
    return args.length
      ? resolved.reduce(
          reduceCallback,
          typeof args[0] === 'function' ? toValue(args[0]()) : toValue(args[0]),
        )
      : resolved.reduce(reduceCallback);
  });
}
