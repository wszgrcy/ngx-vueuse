/**
 * Reactive DeviceOrientationEvent for Angular
 *
 * Ported from VueUse useDeviceOrientation
 * @see https://vueuse.org/useDeviceOrientation
 */

import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import type { Supportable } from '../types';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

export interface UseDeviceOrientationOptions {
  /**
   * Specify a custom `window` instance, e.g. working with iframes or in testing environments.
   */
  window?: Window;
}

/** @deprecated use {@link UseDeviceOrientationOptions} instead */
export type DeviceOrientationOptions = UseDeviceOrientationOptions;

export interface UseDeviceOrientationReturn extends Supportable {
  isAbsolute: Signal<boolean>;
  alpha: Signal<number | null>;
  beta: Signal<number | null>;
  gamma: Signal<number | null>;
}

/**
 * Reactive DeviceOrientationEvent.
 *
 * @see https://vueuse.org/useDeviceOrientation
 * @param options
 */
export function useDeviceOrientation(
  options: UseDeviceOrientationOptions = {},
): UseDeviceOrientationReturn {
  const { window = defaultWindow } = options;

  const isSupported = useSupported(() => window && 'DeviceOrientationEvent' in window);

  const isAbsolute = signal(false);
  const alpha = signal<number | null>(null);
  const beta = signal<number | null>(null);
  const gamma = signal<number | null>(null);

  if (window && isSupported()) {
    useEventListener(
      window,
      'deviceorientation',
      (event) => {
        isAbsolute.set(event.absolute);
        alpha.set(event.alpha);
        beta.set(event.beta);
        gamma.set(event.gamma);
      },
      { passive: true },
    );
  }

  return {
    isSupported,
    isAbsolute,
    alpha,
    beta,
    gamma,
  };
}
