import type { Awaitable, Pausable } from '@cyia/ngx-vueuse/shared';
import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { UseTimeoutFnOptions } from '@cyia/ngx-vueuse/shared';
import { isClient } from '@cyia/ngx-vueuse/shared';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { useTimeoutFn } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';

export interface UseTimeoutPollOptions {
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

export function useTimeoutPoll(
  fn: () => Awaitable<void>,
  interval: SignalOrValue<number>,
  options: UseTimeoutFnOptions = {},
): Pausable {
  const { immediate = true, immediateCallback = false } = options;

  const { start } = useTimeoutFn(loop, interval, { immediate });

  const isActive = signal(false);

  async function loop() {
    if (!isActive()) return;

    await fn();
    start();
  }

  function resume() {
    if (!isActive()) {
      isActive.set(true);
      if (immediateCallback) fn();
      start();
    }
  }

  function pause() {
    isActive.set(false);
  }

  if (immediate && isClient) resume();

  tryOnScopeDispose(pause);

  return {
    isActive,
    pause,
    resume,
  };
}
