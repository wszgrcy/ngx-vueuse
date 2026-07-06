import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import { toValue } from '../utils/general';
import type { Fn } from '../utils/types';

/**
 * Define the shape of a signal that supports manual reset functionality.
 *
 * This interface extends the standard `Signal` type from Angular and adds a `reset` method.
 * The `reset` method allows the signal to be manually reset to its default value.
 */
export interface ManualResetSignalReturn<T> extends Signal<T> {
  reset: Fn;
}

/**
 * Create a signal with manual reset functionality.
 *
 * @see https://vueuse.org/refManualReset
 * @param defaultValue The value which will be set.
 */
export function refManualReset<T>(defaultValue: T | (() => T)): ManualResetSignalReturn<T> {
  let value: T = toValue(defaultValue);

  const reset = () => {
    value = toValue(defaultValue);
    s.set(value);
  };

  const s = signal(value) as any;
  s.reset = reset;

  return s;
}
