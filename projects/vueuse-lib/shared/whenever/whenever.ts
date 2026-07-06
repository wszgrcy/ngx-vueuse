import type { SignalOrGetter } from '../utils/types';
import { afterNextRender } from '@angular/core';
import { watch, type WatchHandle } from '@cyia/ngx-vueuse/patch';

type Truthy<T> = T extends false | null | undefined ? never : T;

export interface WheneverOptions<Immediate = boolean> {
  /**
   * Only trigger once when the condition is met
   *
   * Override the `once` option in `WatchOptions`
   *
   * @default false
   */
  once?: boolean;
  immediate?: Immediate;
  deep?: boolean;
}

/**
 * Shorthand for watching value to be truthy
 *
 * @see https://vueuse.org/whenever
 */
export function whenever<T>(
  source: SignalOrGetter<T>,
  cb: (value: Truthy<T>, oldValue?: T | undefined) => void,
  options?: WheneverOptions<true>,
): WatchHandle;
export function whenever<T>(
  source: SignalOrGetter<T>,
  cb: (value: Truthy<T>, oldValue?: T) => void,
  options?: WheneverOptions<false>,
): WatchHandle;
export function whenever<T, Immediate extends Readonly<boolean> = false>(
  source: SignalOrGetter<T>,
  cb: (value: Truthy<T>, oldValue?: T | undefined) => void,
  options?: WheneverOptions<Immediate>,
) {
  const stopWatch = watch(
    source,
    (v: any, ov: any) => {
      if (v) {
        if (options?.once) {
          // Schedule stop for after next render cycle
          afterNextRender(() => {
            stop?.();
          });
        }
        cb(v as Truthy<T>, ov);
      }
    },
    {
      ...options,
      once: false,
    } as Parameters<typeof watch>[2],
  );

  const stop = stopWatch.stop;

  return stopWatch;
}
