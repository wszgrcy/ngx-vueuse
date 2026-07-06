import { type WritableSignal, signal } from '@angular/core';
import type { Signal } from '../utils/types';
import { toValue } from '../utils/general';

type ReadonlySignal<T> = { readonly: true } & Signal<T>;

function shallowReadonlySignal<T>(sig: WritableSignal<T>): ReadonlySignal<T> {
  return Object.assign(sig, { readonly: true as const });
}

export interface UseCounterOptions {
  min?: number;
  max?: number;
}

export interface UseCounterReturn {
  /**
   * The current value of the counter.
   */
  readonly count: ReadonlySignal<number>;
  /**
   * Increment the counter.
   *
   * @param {number} [delta=1] The number to increment.
   */
  inc: (delta?: number) => void;
  /**
   * Decrement the counter.
   *
   * @param {number} [delta=1] The number to decrement.
   */
  dec: (delta?: number) => void;
  /**
   * Get the current value of the counter.
   */
  get: () => number;
  /**
   * Set the counter to a new value.
   *
   * @param val The new value of the counter.
   */
  set: (val: number) => void;
  /**
   * Reset the counter to an initial value.
   */
  reset: (val?: number) => number;
}

/**
 * Basic counter with utility functions.
 *
 * @see https://vueuse.org/useCounter
 * @param [initialValue]
 * @param options
 */
export function useCounter(
  initialValue: number | WritableSignal<number> = 0,
  options: UseCounterOptions = {},
): UseCounterReturn {
  const numInit = typeof initialValue === 'number' ? initialValue : initialValue();
  let _initialValue = toValue(numInit);
  const count = signal(numInit);

  const { max = Number.POSITIVE_INFINITY, min = Number.NEGATIVE_INFINITY } = options;

  const inc = (delta = 1) => count.set(Math.max(Math.min(max, count() + delta), min));
  const dec = (delta = 1) => count.set(Math.min(Math.max(min, count() - delta), max));
  const get = () => count();
  const set = (val: number) => count.set(Math.max(min, Math.min(max, val)));
  const reset = (val = _initialValue) => {
    _initialValue = val;
    set(val);
    return val;
  };

  return { count: shallowReadonlySignal(count), inc, dec, get, set, reset };
}
