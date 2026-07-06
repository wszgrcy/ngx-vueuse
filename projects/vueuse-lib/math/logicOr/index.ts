import type { Signal } from '@angular/core';
import { computed, isSignal } from '@angular/core';

type MaybeSignalOrValue<T> = Signal<T> | T | (() => T);

function toValue<T>(source: MaybeSignalOrValue<T>): T {
  if (isSignal(source)) return source();
  if (typeof source === 'function') return (source as () => T)();
  return source;
}

/**
 * `OR` conditions for signals.
 *
 * @see https://vueuse.org/logicOr
 *
 * __NO_SIDE_EFFECTS__
 */
export function logicOr(...args: MaybeSignalOrValue<any>[]): Signal<boolean> {
  return computed(() => args.some((i) => toValue(i)));
}

/** @deprecated use `logicOr` instead */
export const or = logicOr;
