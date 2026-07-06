import { signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { useThrottleFn } from '../useThrottleFn';
import { toValue } from '../utils/general';

export type RefThrottledReturn<T = any> = Signal<T>;

/**
 * Throttle execution of a function. Especially useful for rate limiting
 * execution of handlers on events like resize and scroll.
 *
 * @param value Ref value to be watched with throttle effect
 * @param delay A zero-or-greater delay in milliseconds. For event callbacks, values around 100 or 250 (or even higher) are most useful.
 * @param trailing if true, update the value again after the delay time is up
 * @param leading if true, update the value on the leading edge of the ms timeout
 */
export function refThrottled<T = any>(
  value: Signal<T> | T,
  delay = 200,
  trailing = true,
  leading = true,
): RefThrottledReturn<T> {
  if (delay <= 0) return value as RefThrottledReturn<T>;

  const throttled = signal(toValue(value) as T);

  const updater = useThrottleFn(
    () => {
      throttled.set(toValue(value) as T);
    },
    toValue(delay),
    trailing,
    leading,
  );

  try {
    // Watch for changes (equivalent to Vue's watch(value, () => updater()))
    watch(value, () => updater());
  } catch {
    // Not in injection context - just set once
  }

  return throttled as RefThrottledReturn<T>;
}

/** @deprecated use `refThrottled` instead */
export const throttledRef = refThrottled;
/** @deprecated use `refThrottled` instead */
export const useThrottle = refThrottled;
