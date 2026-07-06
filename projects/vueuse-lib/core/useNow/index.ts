import type { Fn, Pausable } from '@cyia/ngx-vueuse/shared';
import type { Signal } from '@angular/core';
import type { ConfigurableScheduler } from '../_configurable';
import { useIntervalFn } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import { useRafFn } from '../useRafFn';

function getDefaultScheduler(options: UseNowOptions<boolean>) {
  if ('interval' in options || 'immediate' in options) {
    const { interval = 'requestAnimationFrame', immediate = true } = options;

    return interval === 'requestAnimationFrame'
      ? (fn: Fn) => useRafFn(fn, { immediate })
      : (fn: Fn) => useIntervalFn(fn, interval, options as any);
  }

  return useRafFn;
}

export interface UseNowOptions<Controls extends boolean> extends ConfigurableScheduler {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls;

  /**
   * Start the clock immediately
   *
   * @deprecated Please use `scheduler` option instead
   * @default true
   */
  immediate?: boolean;

  /**
   * Update interval in milliseconds, or use requestAnimationFrame
   *
   * @deprecated Please use `scheduler` option instead
   * @default requestAnimationFrame
   */
  interval?: 'requestAnimationFrame' | number;
}

export type UseNowReturn<Controls extends boolean> = Controls extends true
  ? { now: Signal<Date> } & Pausable
  : Signal<Date>;

/**
 * Reactive current Date instance.
 *
 * @see https://vueuse.org/useNow
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useNow(options?: UseNowOptions<false>): Signal<Date>;
export function useNow(options: UseNowOptions<true>): { now: Signal<Date> } & Pausable;

/**
 * Reactive current Date instance.
 *
 * @see https://vueuse.org/useNow
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useNow(options: UseNowOptions<boolean> = {}): UseNowReturn<boolean> {
  const { controls: exposeControls = false, scheduler = getDefaultScheduler(options) } = options;

  const now = signal(new Date());

  const update = () => now.set(new Date());

  const controls = scheduler(update);

  if (exposeControls) {
    return {
      now,
      ...controls,
    } as any;
  } else {
    return now;
  }
}
