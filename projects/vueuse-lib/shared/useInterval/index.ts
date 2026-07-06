import { signal, computed, type Signal } from '@angular/core';
import type { SignalOrGetter } from '../utils/types';
import type { Pausable } from '../utils/types';
import { useIntervalFn } from '../useIntervalFn';

export interface UseIntervalOptions<Controls extends boolean = false> {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls;
  /**
   * Execute the update immediately on calling
   *
   * @default true
   */
  immediate?: boolean;
  /**
   * Callback on every interval
   */
  callback?: (count: number) => void;
}

export interface UseIntervalControls {
  counter: Signal<number>;
  reset: () => void;
}

export type UseIntervalReturn<C extends boolean = false> = C extends true
  ? { counter: Signal<number>; reset: () => void } & Pausable
  : Signal<number>;

/**
 * Reactive counter increases on every interval
 *
 * @see https://vueuse.org/useInterval
 * @param interval
 * @param options
 */
export function useInterval<C extends boolean = false>(
  interval: SignalOrGetter<number> = 1000,
  options?: UseIntervalOptions<C>,
): UseIntervalReturn<C> {
  const { controls: exposeControls = false, immediate = true, callback } = options || {};

  const counter = signal(0);
  const update = () => counter.update((v: number) => v + 1);
  const reset = () => {
    counter.set(0);
  };
  const controls = useIntervalFn(
    callback
      ? () => {
          update();
          callback(counter());
        }
      : update,
    interval,
    { immediate },
  );

  if (exposeControls) {
    const readOnlyCounter = computed(() => counter());
    return {
      counter: readOnlyCounter,
      reset,
      ...controls,
    } as unknown as UseIntervalReturn<C>;
  } else {
    return computed(() => counter()) as unknown as UseIntervalReturn<C>;
  }
}
