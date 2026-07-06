import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import type { TimerHandle } from '../utils';
import { toValue } from '../utils/general';
import { tryOnScopeDispose } from '../tryOnScopeDispose';

export type RefAutoResetReturn<T = any> = Signal<T> & { set: (value: T) => void };

/**
 * Create a signal which will be reset to the default value after some time.
 *
 * @see https://vueuse.org/refAutoReset
 * @param defaultValue The value which will be set.
 * @param afterMs      A zero-or-greater delay in milliseconds.
 */
export function refAutoReset<T>(
  defaultValue: T | (() => T),
  afterMs: number | (() => number) = 10000,
): RefAutoResetReturn<T> {
  let value: T = toValue(defaultValue);
  let timer: TimerHandle;

  const resetAfter = () =>
    setTimeout(
      () => {
        value = toValue(defaultValue);
        originalSet(value);
      },
      toValue(afterMs as any),
    );

  try {
    tryOnScopeDispose(() => {
      clearTimeout(timer);
    });
  } catch {
    // Not in injection context (e.g., tests or standalone usage)
  }

  const s = signal(value) as any;

  // Override set to include auto-reset logic
  const originalSet = s.set.bind(s);
  s.set = (newValue: T) => {
    value = newValue;
    originalSet(newValue);

    clearTimeout(timer);
    timer = resetAfter();
  };

  return s;
}

/** @deprecated use `refAutoReset` instead */
export const autoResetRef = refAutoReset;
