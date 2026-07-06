import { isSignal, signal, type Signal } from '@angular/core';

/**
 * Create a shallow readonly signal (Vue's shallowReadonly equivalent).
 * The signal itself remains writable internally, but the returned
 * reference is marked as readonly for external consumers.
 */
export function shallowReadonly<T>(sig: Signal<T>): Signal<T> & { readonly: true } {
  return Object.assign(sig, { readonly: true as const });
}
import type { SignalOrValue } from './types';

/**
 * Unwrap a signal, getter function, or return the raw value.
 * Analogous to Vue's `toValue()` / `unref()`.
 * Handles: Signal<T> | (() => T) | T => T
 */
export function toValue<T>(v: SignalOrValue<T> | (() => T)): T {
  if (isSignal(v)) return v() as T;
  if (typeof v === 'function') return (v as () => T)();
  return v as unknown as T;
}

export function promiseTimeout(
  ms: number,
  throwOnTimeout = false,
  reason = 'Timeout',
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (throwOnTimeout) setTimeout(reject, ms, reason);
    else setTimeout(resolve, ms);
  });
}

export function identity<T>(arg: T): T {
  return arg;
}

export interface SingletonPromiseReturn<T> {
  (): Promise<T>;
  /**
   * Reset current staled promise.
   * await it to have proper shutdown.
   */
  reset: () => Promise<void>;
}
/**
 * Create singleton promise function
 *
 * @example
 * ```
 * const promise = createSingletonPromise(async () => { ... })
 *
 * await promise()
 * await promise() // all of them will be bind to a single promise instance
 * await promise() // and be resolved together
 * ```
 */

export function createSingletonPromise<T>(fn: () => Promise<T>): SingletonPromiseReturn<T> {
  let _promise: Promise<T> | undefined;

  function wrapper() {
    if (!_promise) _promise = fn();
    return _promise;
  }
  wrapper.reset = async () => {
    const _prev = _promise;
    _promise = undefined;
    if (_prev) await _prev;
  };
  return wrapper as SingletonPromiseReturn<T>;
}

/**
 * Create a promise-based singleton that can be called multiple times
 */
export function createSingletonPromiseWithContext<T>(fn: () => Promise<T>) {
  return createSingletonPromise(fn);
}

/**
 * Convert a value to an array.
 */
export function toArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Unwrap all signals/getters in an array.
 * Use this to resolve `SignalOrGetter<T>[] | T[]` to `T[]` inside computed blocks.
 * Analogous to Vue's `array.map(i => toValue(i))`.
 */
export function resolveAll<T>(arr: SignalOrValue<T>[]): T[] {
  return (arr as any[]).map((i: any) => toValue(i));
}

/**
 * Invoke a function and return the result.
 */
export function invoke<T>(fn: () => T): T {
  return fn();
}

/**
 * Create a RemovableRef with Vue-like .value API.
 * The returned object is a Signal with .value getter/setter and .set() method.
 */
export function createRemovableRef<T>(initialValue: T) {
  const s = signal<T>(initialValue);

  return s;
}

/**
 * Check if an object has one of the given props.
 */
export function containsProp(obj: object, ...props: string[]) {
  return props.some((k) => k in obj);
}

/**
 * Increase a string value with a unit.
 *
 * @example '2px' + 1 = '3px'
 * @example '15em' + (-2) = '13em'
 */
export function increaseWithUnit(target: number, delta: number): number;
export function increaseWithUnit(target: string, delta: number): string;
export function increaseWithUnit(target: string | number, delta: number): string | number;
export function increaseWithUnit(target: string | number, delta: number): string | number {
  if (typeof target === 'number') return target + delta;
  const value = target.match(/^-?\d+\.?\d*/)?.[0] || '';
  const unit = target.slice(value.length);
  const result = Number.parseFloat(value) + delta;
  if (Number.isNaN(result)) return target;
  return result + unit;
}

/**
 * Create a new subset object by giving keys.
 */
export function objectPick<O extends object, T extends keyof O>(
  obj: O,
  keys: T[],
  omitUndefined = false,
) {
  return keys.reduce(
    (n, k) => {
      if (k in obj) {
        if (!omitUndefined || obj[k] !== undefined) n[k] = obj[k];
      }
      return n;
    },
    {} as Pick<O, T>,
  );
}

/**
 * Create a new subset object by omitting given keys.
 */
export function objectOmit<O extends object, T extends keyof O>(
  obj: O,
  keys: T[],
  omitUndefined = false,
) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => (!omitUndefined || value !== undefined) && !keys.includes(key as T),
    ),
  ) as Omit<O, T>;
}

/**
 * Get the entries of an object with proper typing.
 */
export function objectEntries<T extends object>(obj: T) {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

/**
 * Get a px value for SSR use, do not rely on this method outside of SSR as REM unit is assumed at 16px, which might not be the case on the client
 */
export function pxValue(px: string) {
  return px.endsWith('rem') ? Number.parseFloat(px) * 16 : Number.parseFloat(px);
}
