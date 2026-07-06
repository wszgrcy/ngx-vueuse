import type { Signal } from '@angular/core';
import { isSignal } from '@angular/core';

export type ExtendRefReturn<T = any> = Signal<T>;

export interface ExtendRefOptions<Unwrap extends boolean = boolean> {
  /**
   * Is the extends properties enumerable
   *
   * @default false
   */
  enumerable?: boolean;

  /**
   * Unwrap for Signal properties
   *
   * @default true
   */
  unwrap?: Unwrap;
}

/**
 * Overload 1: Unwrap set to false
 */
export function extendRef<
  R extends Signal<any>,
  Extend extends object,
  Options extends ExtendRefOptions<false>,
>(ref: R, extend: Extend, options?: Options): Extend & R;
/**
 * Overload 2: Unwrap unset or set to true
 */
export function extendRef<
  R extends Signal<any>,
  Extend extends object,
  Options extends ExtendRefOptions,
>(ref: R, extend: Extend, options?: Options): Extend & R;

export function extendRef<R extends Signal<any>, Extend extends object>(
  ref: R,
  extend: Extend,
  { enumerable = false, unwrap = true }: ExtendRefOptions = {},
): ExtendRefReturn<any> {
  for (const [key, value] of Object.entries(extend)) {
    if (key === 'value') continue;

    if (isSignal(value) && unwrap) {
      Object.defineProperty(ref, key, {
        get() {
          return value();
        },
        set(v) {
          // Signals don't support direct assignment, so we skip setting
        },
        enumerable,
      });
    } else {
      Object.defineProperty(ref, key, { value, enumerable });
    }
  }
  return ref;
}
