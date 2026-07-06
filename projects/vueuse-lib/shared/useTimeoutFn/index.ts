import { signal, computed } from '@angular/core';
import type { SignalOrValue, AnyFn, Stoppable, TimerHandle } from '../utils/types';
import { isClient } from '../utils/is';
import { toValue } from '../utils/general';
import { tryOnScopeDispose } from '../tryOnScopeDispose';

export interface UseTimeoutFnOptions {
  /**
   * Start the timer immediately
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Execute the callback immediately after calling `start`
   *
   * @default false
   */
  immediateCallback?: boolean;
}

export type UseTimeoutFnReturn<CallbackFn extends AnyFn> = Stoppable<
  Parameters<CallbackFn> | []
> & {
  isPending: ReturnType<typeof computed>;
};

/**
 * Wrapper for `setTimeout` with controls.
 *
 * @param cb
 * @param interval
 * @param options
 */
export function useTimeoutFn<CallbackFn extends AnyFn>(
  cb: CallbackFn,
  interval: SignalOrValue<number>,
  options: UseTimeoutFnOptions = {},
): UseTimeoutFnReturn<CallbackFn> {
  const { immediate = true, immediateCallback = false } = options;

  const isPendingSignal = signal(false);

  let timer: TimerHandle;

  function clear() {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  }

  function stop() {
    isPendingSignal.set(false);
    clear();
  }

  function start(...args: Parameters<CallbackFn> | []) {
    if (immediateCallback) cb();
    clear();
    isPendingSignal.set(true);
    const intervalValue = toValue(interval);
    timer = setTimeout(() => {
      isPendingSignal.set(false);
      timer = undefined;
      cb(...args);
    }, intervalValue);
  }

  if (immediate) {
    isPendingSignal.set(true);
    if (isClient) start();
  }

  tryOnScopeDispose(stop);

  return {
    isPending: computed(() => isPendingSignal()),
    start,
    stop,
  };
}
