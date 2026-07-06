// by @linusborg https://github.com/LinusBorg

import type { Signal } from '@angular/core';
import { effect, signal, untracked } from '@angular/core';

export type ComputedEagerOptions = Record<string, unknown>;

export type ComputedEagerReturn<T = unknown> = Signal<T> & { (): T };

/**
 *
 * @deprecated This function will be removed in future behavior.
 *
 * Note: If you are using Angular, you can straight use computed instead.
 * Because in Angular, if computed new value does not change,
 * computed, effect, watch, watchEffect, render dependencies will not be triggered.
 *
 * @param fn effect function
 * @param options WatchOptionsBase
 * @returns readonly signal
 */
export function computedEager<T>(
  fn: () => T,
  options?: ComputedEagerOptions,
): ComputedEagerReturn<T> {
  const result = signal<T>(undefined as unknown as T);

  // Use effect to watch the fn and update the signal
  effect(() => {
    const value = fn();
    untracked(() => {
      result.set(value);
    });
  }, options as any);

  return result as ComputedEagerReturn<T>;
}

/** @deprecated use `computedEager` instead */
export const eagerComputed = computedEager;
