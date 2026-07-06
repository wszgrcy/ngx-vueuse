import type { ConfigurableWindow } from '../_configurable';
import type { Signal } from '@angular/core';
import { useMediaQuery } from '../useMediaQuery';

/**
 * Reactive dark theme preference.
 *
 * @see https://vueuse.org/usePreferredDark
 * @param [options]
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePreferredDark(options?: ConfigurableWindow): Signal<boolean> {
  return useMediaQuery('(prefers-color-scheme: dark)', options);
}
