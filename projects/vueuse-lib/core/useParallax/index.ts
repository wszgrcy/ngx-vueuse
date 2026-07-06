/**
 * Reactive Parallax effect for Angular
 *
 * Ported from VueUse useParallax
 * @see https://vueuse.org/useParallax
 */

import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { MaybeElementRef } from '../unrefElement';
import { defaultWindow } from '../_configurable';
import { useDeviceOrientation } from '../useDeviceOrientation';
import { useMouseInElement } from '../useMouseInElement';
import { useScreenOrientation } from '../useScreenOrientation';

export interface UseParallaxOptions extends ConfigurableWindow {
  deviceOrientationTiltAdjust?: (i: number) => number;
  deviceOrientationRollAdjust?: (i: number) => number;
  mouseTiltAdjust?: (i: number) => number;
  mouseRollAdjust?: (i: number) => number;
}

export interface UseParallaxReturn {
  /**
   * Roll value. Scaled to `-0.5 ~ 0.5`
   */
  roll: Signal<number>;
  /**
   * Tilt value. Scaled to `-0.5 ~ 0.5`
   */
  tilt: Signal<number>;
  /**
   * Sensor source, can be `mouse` or `deviceOrientation`
   */
  source: Signal<'deviceOrientation' | 'mouse'>;
}

/**
 * Create parallax effect easily. It uses `useDeviceOrientation` and fallback to `useMouse`
 * if orientation is not supported.
 *
 * @param target
 * @param options
 */
export function useParallax(
  target: MaybeElementRef,
  options: UseParallaxOptions = {},
): UseParallaxReturn {
  const {
    deviceOrientationTiltAdjust = (i) => i,
    deviceOrientationRollAdjust = (i) => i,
    mouseTiltAdjust = (i) => i,
    mouseRollAdjust = (i) => i,
    window = defaultWindow,
  } = options;

  const orientation = useDeviceOrientation({ window });
  const screenOrientation = useScreenOrientation({ window });
  const {
    elementX: x,
    elementY: y,
    elementWidth: width,
    elementHeight: height,
  } = useMouseInElement(target, { handleOutside: false, window });

  const source = computed(() => {
    if (
      orientation.isSupported() &&
      ((orientation.alpha() != null && orientation.alpha() !== 0) ||
        (orientation.gamma() != null && orientation.gamma() !== 0))
    ) {
      return 'deviceOrientation';
    }
    return 'mouse';
  });

  const roll = computed(() => {
    if (source() === 'deviceOrientation') {
      let value: number;
      switch (screenOrientation.orientation()) {
        case 'landscape-primary':
          value = orientation.gamma()! / 90;
          break;
        case 'landscape-secondary':
          value = -orientation.gamma()! / 90;
          break;
        case 'portrait-primary':
          value = -orientation.beta()! / 90;
          break;
        case 'portrait-secondary':
          value = orientation.beta()! / 90;
          break;
        default:
          value = -orientation.beta()! / 90;
      }
      return deviceOrientationRollAdjust(value);
    } else {
      const value = -(y() - height() / 2) / height();
      return mouseRollAdjust(value);
    }
  });

  const tilt = computed(() => {
    if (source() === 'deviceOrientation') {
      let value: number;
      switch (screenOrientation.orientation()) {
        case 'landscape-primary':
          value = orientation.beta()! / 90;
          break;
        case 'landscape-secondary':
          value = -orientation.beta()! / 90;
          break;
        case 'portrait-primary':
          value = orientation.gamma()! / 90;
          break;
        case 'portrait-secondary':
          value = -orientation.gamma()! / 90;
          break;
        default:
          value = orientation.gamma()! / 90;
      }
      return deviceOrientationTiltAdjust(value);
    } else {
      const value = (x() - width() / 2) / width();
      return mouseTiltAdjust(value);
    }
  });

  return { roll, tilt, source };
}
