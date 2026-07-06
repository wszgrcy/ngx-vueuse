/**
 * Reactive vibrate for Angular.
 *
 * Ported from VueUse's useVibrate to Angular signals.
 *
 * @see https://vueuse.org/useVibrate
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */

import type { Fn, Pausable, Arrayable } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableNavigator, ConfigurableScheduler } from '../_configurable';
import type { Supportable } from '../types';
import { defaultNavigator } from '../_configurable';
import { useSupported } from '../useSupported';
import { type Signal } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

type MaybeSignal<T> = T | Signal<T>;

export interface UseVibrateOptions extends ConfigurableNavigator, ConfigurableScheduler {
  /**
   *
   * Vibration Pattern
   *
   * An array of values describes alternating periods in which the
   * device is vibrating and not vibrating. Each value in the array
   * is converted to an integer, then interpreted alternately as
   * the number of milliseconds the device should vibrate and the
   * number of milliseconds it should not be vibrating
   *
   * @default []
   *
   */
  pattern?: MaybeSignal<Arrayable<number>>;
  /**
   * Interval to run a persistent vibration, in ms
   *
   * Pass `0` to disable
   *
   * @deprecated Please use `scheduler` option instead
   * @default 0
   *
   */
  interval?: number;
}

export interface UseVibrateReturn extends Supportable {
  pattern: MaybeSignal<Arrayable<number>>;
  intervalControls?: Pausable;
  vibrate: (pattern?: Arrayable<number>) => void;
  stop: () => void;
}

function getDefaultScheduler(options: UseVibrateOptions = {}): Fn | undefined {
  const { interval = 0 } = options;

  if (interval === 0) return undefined;

  // Note: In Angular, we would need to implement useIntervalFn separately
  // For now, return undefined as the interval functionality requires additional infrastructure
  return undefined;
}

/**
 * Reactive vibrate
 *
 * @see https://vueuse.org/useVibrate
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useVibrate(options?: UseVibrateOptions): UseVibrateReturn {
  const {
    pattern = [],
    scheduler = getDefaultScheduler(options),
    navigator: customNavigator = defaultNavigator,
  } = options || {};

  const isSupported = useSupported(
    () => typeof customNavigator !== 'undefined' && 'vibrate' in customNavigator,
  );

  const patternSignal = toValue(pattern) as Signal<Arrayable<number>> | Arrayable<number>;

  const vibrate = (pat?: Arrayable<number>) => {
    if (isSupported())
      customNavigator!.vibrate(pat ?? toValue((pattern as MaybeSignal<Arrayable<number>>) ?? []));
  };

  const intervalControls = scheduler?.(vibrate as Fn) as Pausable | undefined;

  // Attempt to stop the vibration:
  const stop = () => {
    // Stop the vibration if we need to:
    if (isSupported()) customNavigator!.vibrate(0);
    intervalControls?.pause();
  };

  return {
    isSupported,
    pattern,
    intervalControls,
    vibrate,
    stop,
  };
}
