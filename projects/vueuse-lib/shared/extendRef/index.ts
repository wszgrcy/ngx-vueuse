import type { Signal, ShallowUnwrapRef, UnwrapRef } from '../utils/types';
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
   * Unwrap for Ref properties
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
>(ref: R, extend: Extend, options?: Options): ShallowUnwrapRef<Extend> & R;
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
): ExtendRefReturn<UnwrapRef<R>> {
  for (const [key, value] of Object.entries(extend)) {
    if (key === 'value') continue;

    if (isSignal(value) && unwrap) {
      Object.defineProperty(ref, key, {
        get() {
          return value();
        },
        set(v) {
          (value as any).set(v);
        },
        enumerable,
      });
    } else {
      Object.defineProperty(ref, key, { value, enumerable });
    }
  }
  return ref;
}
