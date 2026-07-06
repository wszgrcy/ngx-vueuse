import type { Signal } from '@angular/core';
import { signal, effect } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { shallowReadonly } from '@cyia/ngx-vueuse/shared';

/**
 * Holds the previous value of a signal.
 *
 * @see   {@link https://vueuse.org/usePrevious}
 */
export function usePrevious<T>(value: Signal<T> | T | (() => T)): Signal<T | undefined>;
export function usePrevious<T>(value: Signal<T> | T | (() => T), initialValue: T): Signal<T>;
export function usePrevious<T>(
  value: Signal<T> | T | (() => T),
  initialValue?: T,
): Signal<T | undefined> {
  const previous = signal<T | undefined>(initialValue);
  let currentValue = toValue(value);

  effect(() => {
    const newValue = toValue(value);
    if (newValue !== currentValue) {
      previous.set(currentValue);
      currentValue = newValue;
    }
  });

  return shallowReadonly(previous) as Signal<T | undefined>;
}
