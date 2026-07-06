/**
 * Reactive DeviceMotionEvent for Angular
 *
 * Ported from VueUse useDeviceMotion
 * @see https://vueuse.org/useDeviceMotion
 */

import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';
import { bypassFilter, createFilterWrapper } from '@cyia/ngx-vueuse/shared';

export interface UseDeviceMotionOptions {
  /**
   * Specify a custom `window` instance, e.g. working with iframes or in testing environments.
   */
  window?: Window;

  /**
   * Request for permissions immediately if it's not granted,
   * otherwise label and deviceIds could be empty
   * @default false
   */
  requestPermissions?: boolean;

  /**
   * Event filter for the event listener
   * @default bypassFilter
   */
  eventFilter?: typeof bypassFilter;
}

/** @deprecated use {@link UseDeviceMotionOptions} instead */
export type DeviceMotionOptions = UseDeviceMotionOptions;

interface DeviceMotionEventiOS extends UseDeviceMotionOptions {
  requestPermission: () => Promise<'granted' | 'denied'>;
}

export interface UseDeviceMotionReturn {
  acceleration: Signal<{ x: number | null; y: number | null; z: number | null } | null>;
  accelerationIncludingGravity: Signal<{
    x: number | null;
    y: number | null;
    z: number | null;
  } | null>;
  rotationRate: Signal<{ alpha: number | null; beta: number | null; gamma: number | null } | null>;
  interval: Signal<number>;
  isSupported: Signal<boolean>;
  requirePermissions: Signal<boolean>;
  ensurePermissions: () => Promise<void>;
  permissionGranted: Signal<boolean>;
}

interface DeviceMotionEventAcceleration {
  x: number | null;
  y: number | null;
  z: number | null;
}

interface DeviceMotionEventRotationRate {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

/**
 * Reactive DeviceMotionEvent.
 *
 * @see https://vueuse.org/useDeviceMotion
 * @param options
 */
export function useDeviceMotion(options: UseDeviceMotionOptions = {}): UseDeviceMotionReturn {
  const {
    window = defaultWindow,
    requestPermissions = false,
    eventFilter = bypassFilter,
  } = options;

  const isSupported = useSupported(() => typeof DeviceMotionEvent !== 'undefined');
  const requirePermissions = useSupported(
    () =>
      isSupported() &&
      'requestPermission' in DeviceMotionEvent &&
      typeof (
        DeviceMotionEvent as typeof DeviceMotionEvent & {
          requestPermission?: () => Promise<'granted' | 'denied'>;
        }
      ).requestPermission === 'function',
  );
  const permissionGranted = signal(false);

  const acceleration = signal<{ x: number | null; y: number | null; z: number | null } | null>({
    x: null,
    y: null,
    z: null,
  });
  const rotationRate = signal<{
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  } | null>({ alpha: null, beta: null, gamma: null });
  const interval = signal(0);
  const accelerationIncludingGravity = signal<{
    x: number | null;
    y: number | null;
    z: number | null;
  } | null>({
    x: null,
    y: null,
    z: null,
  });

  function init() {
    if (window) {
      const onDeviceMotion = createFilterWrapper(eventFilter, (event: DeviceMotionEvent) => {
        acceleration.set({
          x: event.acceleration?.x || null,
          y: event.acceleration?.y || null,
          z: event.acceleration?.z || null,
        });
        accelerationIncludingGravity.set({
          x: event.accelerationIncludingGravity?.x || null,
          y: event.accelerationIncludingGravity?.y || null,
          z: event.accelerationIncludingGravity?.z || null,
        });
        rotationRate.set({
          alpha: event.rotationRate?.alpha || null,
          beta: event.rotationRate?.beta || null,
          gamma: event.rotationRate?.gamma || null,
        });
        interval.set(event.interval || 0);
      });

      useEventListener(window, 'devicemotion', onDeviceMotion);
    }
  }

  const ensurePermissions = async () => {
    if (!requirePermissions()) {
      permissionGranted.set(true);
      return;
    }

    if (permissionGranted()) {
      return;
    }

    if (requirePermissions()) {
      const requestPermission = (DeviceMotionEvent as unknown as DeviceMotionEventiOS)
        .requestPermission;
      try {
        const response = await requestPermission();
        if (response === 'granted') {
          permissionGranted.set(true);
          init();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (isSupported()) {
    if (requestPermissions && requirePermissions()) {
      ensurePermissions().then(() => init());
    } else {
      init();
    }
  }

  return {
    acceleration,
    accelerationIncludingGravity,
    rotationRate,
    interval,
    isSupported,
    requirePermissions,
    ensurePermissions,
    permissionGranted,
  };
}
