import type { Signal } from '@angular/core';
import { computed, isSignal } from '@angular/core';

type MaybeSignalOrValue<T> = Signal<T> | T | (() => T);

function toValue<T>(source: MaybeSignalOrValue<T>): T {
  if (isSignal(source)) return source();
  if (typeof source === 'function') return (source as () => T)();
  return source;
}

/**
 * `AND` conditions for signals.
 *
 * @see https://vueuse.org/logicAnd
 *
 * __NO_SIDE_EFFECTS__
 */
export function logicAnd(...args: MaybeSignalOrValue<any>[]): Signal<boolean> {
  return computed(() => args.every((i) => toValue(i)));
}

/** @deprecated use `logicAnd` instead */
export const and = logicAnd;
