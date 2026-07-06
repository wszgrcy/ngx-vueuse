/**
 * Reactive devicePixelRatio tracking for Angular
 *
 * Ported from VueUse useDevicePixelRatio
 * @see https://vueuse.org/useDevicePixelRatio
 */

import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import type { Fn } from '@cyia/ngx-vueuse/shared';
import { shallowReadonly } from '@cyia/ngx-vueuse/shared';
import { watchImmediate } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { useMediaQuery } from '../useMediaQuery';

export interface UseDevicePixelRatioOptions {
  /**
   * Specify a custom `window` instance, e.g. working with iframes or in testing environments.
   */
  window?: Window;
}

export interface UseDevicePixelRatioReturn {
  /**
   * The current device pixel ratio value (read-only)
   */
  pixelRatio: Signal<number> & { readonly: true };

  /**
   * Stop watching the device pixel ratio
   */
  stop: Fn;
}

/**
 * Reactively track `window.devicePixelRatio`.
 *
 * @see https://vueuse.org/useDevicePixelRatio
 *
 * @param options
 * @returns An object containing the pixel ratio signal and a stop function
 */
export function useDevicePixelRatio(
  options: UseDevicePixelRatioOptions = {},
): UseDevicePixelRatioReturn {
  const { window = defaultWindow } = options;

  const pixelRatio = signal(1);
  const query = useMediaQuery(() => `(resolution: ${pixelRatio()}dppx)`, options);
  const stop: Fn = () => {};

  if (window) {
    watchImmediate(query, () => {
      pixelRatio.set(window.devicePixelRatio);
    });
  }

  return {
    pixelRatio: shallowReadonly(pixelRatio),
    stop,
  };
}
