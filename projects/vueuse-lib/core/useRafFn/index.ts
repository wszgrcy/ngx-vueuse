import { computed, signal } from '@angular/core';
import type { Pausable } from '@cyia/ngx-vueuse/shared';
import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import { shallowReadonly, toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';

export interface UseRafFnCallbackArguments {
  /**
   * Time elapsed between this and the last frame.
   */
  delta: number;

  /**
   * Time elapsed since the creation of the web page. See {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp#the_time_origin Time origin}.
   */
  timestamp: DOMHighResTimeStamp;
}

export interface UseRafFnOptions extends ConfigurableWindow {
  /**
   * Start the requestAnimationFrame loop immediately on creation
   *
   * @default true
   */
  immediate?: boolean;
  /**
   * The maximum frame per second to execute the function.
   * Set to `null` to disable the limit.
   *
   * @default null
   */
  fpsLimit?: SignalOrValue<number | null>;
  /**
   * After the requestAnimationFrame loop executed once, it will be automatically stopped.
   *
   * @default false
   */
  once?: boolean;
}

/**
 * Call function on every `requestAnimationFrame`. With controls of pausing and resuming.
 *
 * @see https://vueuse.org/useRafFn
 * @param fn
 * @param options
 */
export function useRafFn(
  fn: (args: UseRafFnCallbackArguments) => void,
  options: UseRafFnOptions = {},
): Pausable {
  const { immediate = true, fpsLimit = null, window = defaultWindow, once = false } = options;

  const isActive = signal(false);
  const intervalLimit = computed(() => {
    const limit = toValue(fpsLimit);
    return limit ? 1000 / limit : null;
  });
  let previousFrameTimestamp = 0;
  let rafId: null | number = null;

  function loop(timestamp: DOMHighResTimeStamp) {
    if (!isActive() || !window) return;

    if (!previousFrameTimestamp) previousFrameTimestamp = timestamp;

    const delta = timestamp - previousFrameTimestamp;
    const limit = intervalLimit();

    if (limit && delta < limit) {
      rafId = window.requestAnimationFrame(loop);
      return;
    }

    previousFrameTimestamp = timestamp;
    fn({ delta, timestamp });
    if (once) {
      isActive.set(false);
      rafId = null;
      return;
    }
    rafId = window.requestAnimationFrame(loop);
  }

  function resume() {
    if (!isActive() && window) {
      isActive.set(true);
      previousFrameTimestamp = 0;
      rafId = window.requestAnimationFrame(loop);
    }
  }

  function pause() {
    isActive.set(false);
    if (rafId != null && window) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  if (immediate) resume();

  // Register cleanup on component destroy
  tryOnScopeDispose(pause);

  return {
    isActive: shallowReadonly(isActive),
    pause,
    resume,
  };
}
