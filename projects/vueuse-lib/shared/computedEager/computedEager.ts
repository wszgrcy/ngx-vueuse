import type { Signal } from '@angular/core';
import { signal, untracked } from '@angular/core';
import { watchEffect } from '@cyia/ngx-vueuse/patch';

export type ComputedEagerOptions = {};

export type ComputedEagerReturn<T = any> = Signal<T>;

/**
 *
 * @deprecated This function will be removed in future versions.
 *
 * Note: If you are using Angular, you can straight use computed instead.
 * Because in Angular, computed only re-evaluates if a dependency changes.
 *
 * @param fn effect function
 * @param options ComputedEagerOptions
 * @returns readonly signal
 */
export function computedEager<T>(
  fn: () => T,
  options?: ComputedEagerOptions,
): ComputedEagerReturn<T> {
  const result = signal(undefined as unknown as T);

  watchEffect(
    () => {
      const value = fn();
      untracked(() => {
        result.set(value);
      });
    },
    {
      ...options,
    },
  );

  return result.asReadonly();
}

/** @deprecated use `computedEager` instead */
export const eagerComputed = computedEager;
