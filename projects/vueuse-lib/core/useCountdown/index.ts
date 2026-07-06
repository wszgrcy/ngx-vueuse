import type { AnyFn, Pausable } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableScheduler } from '../_configurable';
import { useIntervalFn } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

type SignalOrGetter<T> = import('@angular/core').Signal<T> | T | (() => T);

function getDefaultScheduler(options: UseCountdownOptions) {
  if ('interval' in options || 'immediate' in options) {
    const { interval = 1000, immediate = false } = options;

    return (cb: AnyFn) =>
      useIntervalFn(cb, toValue(interval as SignalOrGetter<number>), { immediate });
  }

  return (cb: AnyFn) => useIntervalFn(cb, 1000, { immediate: false });
}

export interface UseCountdownOptions extends ConfigurableScheduler {
  /**
   * Interval for the countdown in milliseconds. Default is 1000ms.
   *
   * @deprecated Please use `scheduler` option instead
   */
  interval?: SignalOrGetter<number>;
  /**
   * Callback function called when the countdown reaches 0.
   */
  onComplete?: () => void;
  /**
   * Callback function called on each tick of the countdown.
   */
  onTick?: () => void;
  /**
   * Start the countdown immediately
   *
   * @deprecated Please use `scheduler` option instead
   * @default false
   */
  immediate?: boolean;
}

export interface UseCountdownReturn extends Pausable {
  /**
   * Current countdown value.
   */
  remaining: import('@angular/core').Signal<number>;
  /**
   * Resets the countdown and repeatsLeft to their initial values.
   */
  reset: (countdown?: SignalOrGetter<number>) => void;
  /**
   * Stops the countdown and resets its state.
   */
  stop: () => void;
  /**
   * Reset the countdown and start it again.
   */
  start: (countdown?: SignalOrGetter<number>) => void;
}

/**
 * Reactive countdown timer in seconds.
 *
 * @param initialCountdown
 * @param options
 *
 * @see https://vueuse.org/useCountdown
 */
export function useCountdown(
  initialCountdown: SignalOrGetter<number>,
  options: UseCountdownOptions = {},
): UseCountdownReturn {
  const remaining = signal(toValue(initialCountdown));

  const { scheduler = getDefaultScheduler(options), onTick, onComplete } = options;

  const controls = scheduler(() => {
    const value = remaining() - 1;
    remaining.set(value < 0 ? 0 : value);
    onTick?.();
    if (remaining() <= 0) {
      controls.pause();
      onComplete?.();
    }
  });

  const reset = (countdown?: SignalOrGetter<number>) => {
    remaining.set(toValue(countdown ?? initialCountdown));
  };

  const stop = () => {
    controls.pause();
    reset();
  };

  const resume = () => {
    if (!controls.isActive()) {
      if (remaining() > 0) {
        controls.resume();
      }
    }
  };

  const start = (countdown?: SignalOrGetter<number>) => {
    reset(countdown);
    controls.resume();
  };

  return {
    remaining,
    reset,
    stop,
    start,
    pause: controls.pause,
    resume,
    isActive: controls.isActive,
  };
}
