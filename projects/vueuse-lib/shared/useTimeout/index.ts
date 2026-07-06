import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import type { UseTimeoutFnOptions } from '../useTimeoutFn';
import type { AnyFn, Stoppable } from '../utils/types';
import { useTimeoutFn } from '../useTimeoutFn';
import { noop } from '../utils/is';

export interface UseTimeoutOptions<Controls extends boolean> extends UseTimeoutFnOptions {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls;
  /**
   * Callback on timeout
   */
  callback?: AnyFn;
}

export type UseTimeoutReturn<Controls extends boolean = false> = Controls extends true
  ? { readonly ready: ReturnType<typeof computed> } & Stoppable
  : ReturnType<typeof computed>;

/**
 * Update value after a given time with controls.
 *
 * @see   {@link https://vueuse.org/useTimeout}
 * @param interval
 * @param options
 */
export function useTimeout(
  interval: SignalOrValue<number> = 1000,
  options: UseTimeoutOptions<boolean> = {},
): UseTimeoutReturn {
  const { controls: exposeControls = false, callback } = options;

  const controls = useTimeoutFn(callback ?? noop, interval, options);

  const ready = computed(() => !controls.isPending());

  if (exposeControls) {
    return {
      ready,
      ...controls,
    } as any;
  } else {
    return ready as UseTimeoutReturn;
  }
}
