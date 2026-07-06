import { signal } from '@angular/core';
import type { Signal } from '@angular/core';

export type CreateRefReturn<T = any, D extends boolean = false> = ShallowOrDeepRef<T, D>;

export type ShallowOrDeepRef<T = any, D extends boolean = false> = D extends true
  ? Signal<T>
  : Signal<T>;

/**
 * Returns a signal with the given value.
 * In Angular, all signals are shallow by default (no nested reactivity).
 *
 * @example createRef(1) // Signal<number>
 * @example createRef(1, false) // Signal<number>
 * @example createRef(1, true) // Signal<number>
 *
 * @param value
 * @param deep - Ignored in Angular (all signals are shallow by default)
 * @returns the signal
 */
export function createRef<T = any, D extends boolean = false>(
  value: T,
  _deep?: D,
): CreateRefReturn<T, D> {
  return signal(value) as CreateRefReturn<T, D>;
}
