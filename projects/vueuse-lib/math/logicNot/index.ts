import type { Signal } from '@angular/core';
import { computed, isSignal } from '@angular/core';

type MaybeSignalOrValue<T> = Signal<T> | T | (() => T);

function toValue<T>(source: MaybeSignalOrValue<T>): T {
  if (isSignal(source)) return source();
  if (typeof source === 'function') return (source as () => T)();
  return source;
}

/**
 * `NOT` conditions for signals.
 *
 * @see https://vueuse.org/logicNot
 *
 * __NO_SIDE_EFFECTS__
 */
export function logicNot(v: MaybeSignalOrValue<any>): Signal<boolean> {
  return computed(() => !toValue(v));
}

/** @deprecated use `logicNot` instead */
export const not = logicNot;
