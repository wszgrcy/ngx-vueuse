import type { AnyFn, Pausable } from '@cyia/ngx-vueuse/shared';
import type { Signal } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableScheduler } from '../_configurable';
import { timestamp } from '@cyia/ngx-vueuse/shared';
import { useIntervalFn } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import { useRafFn } from '../useRafFn/index';

function getDefaultScheduler(options: UseTimestampOptions<boolean>) {
  if ('interval' in options || 'immediate' in options) {
    const { interval = 'requestAnimationFrame', immediate = true } = options;

    return interval === 'requestAnimationFrame'
      ? (cb: AnyFn) => useRafFn(cb, { immediate })
      : (cb: AnyFn) => useIntervalFn(cb, interval, { immediate });
  }

  return useRafFn;
}

export interface UseTimestampOptions<Controls extends boolean> extends ConfigurableScheduler {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls;

  /**
   * Offset value adding to the value
   *
   * @default 0
   */
  offset?: number;

  /**
   * Update the timestamp immediately
   *
   * @deprecated Please use `scheduler` option instead
   * @default true
   */
  immediate?: boolean;

  /**
   * Update interval, or use requestAnimationFrame
   *
   * @deprecated Please use `scheduler` option instead
   * @default requestAnimationFrame
   */
  interval?: 'requestAnimationFrame' | number;
  /**
   * Callback on each update
   */
  callback?: (timestamp: number) => void;
}

export type UseTimestampReturn<Controls extends boolean> = Controls extends true
  ? { timestamp: Signal<number> } & Pausable
  : Signal<number>;

/**
 * Reactive current timestamp.
 *
 * @see https://vueuse.org/useTimestamp
 * @param options
 */
export function useTimestamp(options?: UseTimestampOptions<false>): Signal<number>;
export function useTimestamp(
  options: UseTimestampOptions<true>,
): { timestamp: Signal<number> } & Pausable;

export function useTimestamp(
  options: UseTimestampOptions<boolean> = {},
): UseTimestampReturn<boolean> {
  const {
    controls: exposeControls = false,
    offset = 0,
    scheduler = getDefaultScheduler(options),
    callback,
  } = options;

  const ts = signal(timestamp() + offset);

  const update = () => ts.set(timestamp() + offset);
  const cb = callback
    ? () => {
        update();
        callback(ts());
      }
    : update;

  const controls = scheduler(cb);

  if (exposeControls) {
    return {
      timestamp: ts,
      ...controls,
    } as UseTimestampReturn<boolean>;
  } else {
    return ts;
  }
}
