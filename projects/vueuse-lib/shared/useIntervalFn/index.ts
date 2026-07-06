import { isSignal, signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import type { Fn, SignalOrGetter, Pausable } from '../utils/types';
import { toValue } from '../utils/general';
import { isClient } from '../utils/is';
import { tryOnScopeDispose } from '../tryOnScopeDispose';

export interface UseIntervalFnOptions {
  /**
   * Start the timer immediately
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Execute the callback immediately after calling `resume`
   *
   * @default false
   */
  immediateCallback?: boolean;
}

export type UseIntervalFnReturn = Pausable;

/**
 * Wrapper for `setInterval` with controls
 *
 * @see https://vueuse.org/useIntervalFn
 * @param cb
 * @param interval
 * @param options
 */
export function useIntervalFn(
  cb: Fn,
  interval: SignalOrGetter<number> = 1000,
  options: UseIntervalFnOptions = {},
): UseIntervalFnReturn {
  const { immediate = true, immediateCallback = false } = options;

  let timer: ReturnType<typeof setInterval> | null = null;
  const isActive = signal(false);

  function clean() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function pause() {
    isActive.set(false);
    clean();
  }

  function resume() {
    const intervalValue = toValue(interval);
    if (intervalValue <= 0) return;
    isActive.set(true);
    if (immediateCallback) cb();
    clean();
    if (isActive()) timer = setInterval(cb, intervalValue);
  }

  if (immediate && isClient) resume();

  if (isSignal(interval) || typeof interval === 'function') {
    watch(
      () => toValue(interval),
      () => {
        if (isActive() && isClient) resume();
      },
    ) as any;
  }

  tryOnScopeDispose(pause);

  return {
    isActive,
    pause,
    resume,
  };
}
