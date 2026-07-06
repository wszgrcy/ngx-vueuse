/**
 * Reactive Geolocation API for Angular.
 *
 * Ported from VueUse's useGeolocation to Angular signals.
 *
 * @see https://vueuse.org/useGeolocation
 */

import { signal, type Signal } from '@angular/core';
import { defaultNavigator } from '../../core/_configurable';
import { useSupported } from '../useSupported';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import type { Supportable } from '../types';

export interface UseGeolocationOptions extends Partial<PositionOptions> {
  /**
   * Specify a custom `navigator` instance, e.g. working with iframes or in testing environments.
   */
  navigator?: Navigator;
  /**
   * Manually start watching position updates.
   * @default true
   */
  immediate?: boolean;
}

export interface UseGeolocationReturn extends Supportable {
  coords: Signal<Omit<GeolocationPosition['coords'], 'toJSON'>>;
  locatedAt: Signal<number | null>;
  error: Signal<GeolocationPositionError | null>;
  resume: () => void;
  pause: () => void;
}

/**
 * Reactive Geolocation API.
 *
 * @see https://vueuse.org/useGeolocation
 * @param options
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    maximumAge = 30000,
    timeout = 27000,
    navigator: customNavigator = defaultNavigator,
    immediate = true,
  } = options;

  const isSupported = useSupported(() => customNavigator && 'geolocation' in customNavigator);

  const locatedAt = signal<number | null>(null);
  const error = signal<GeolocationPositionError | null>(null);
  const coords = signal<Omit<GeolocationPosition['coords'], 'toJSON'>>({
    accuracy: 0,
    latitude: Number.POSITIVE_INFINITY,
    longitude: Number.POSITIVE_INFINITY,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  });

  function updatePosition(position: GeolocationPosition) {
    const { toJSON: _, ...coordsData } = position.coords;
    locatedAt.set(position.timestamp);
    coords.set(coordsData);
    error.set(null);
  }

  let watcher: number | undefined;

  function resume() {
    if (isSupported()) {
      watcher = customNavigator!.geolocation.watchPosition(
        updatePosition,
        (err) => error.set(err),
        {
          enableHighAccuracy,
          maximumAge,
          timeout,
        },
      );
    }
  }

  if (immediate) resume();

  function pause() {
    if (watcher && customNavigator) customNavigator.geolocation.clearWatch(watcher);
  }

  tryOnScopeDispose(() => {
    pause();
  });

  return {
    isSupported,
    coords,
    locatedAt,
    error,
    resume,
    pause,
  };
}
