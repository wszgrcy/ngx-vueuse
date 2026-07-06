import { computed, type Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { useMediaQuery } from '../useMediaQuery';

export type ColorSchemeType = 'dark' | 'light' | 'no-preference';

/**
 * Reactive prefers-color-scheme media query.
 *
 * @see https://vueuse.org/usePreferredColorScheme
 * @param [options]
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePreferredColorScheme(options?: ConfigurableWindow): Signal<ColorSchemeType> {
  const isLight = useMediaQuery('(prefers-color-scheme: light)', options);
  const isDark = useMediaQuery('(prefers-color-scheme: dark)', options);

  return computed<ColorSchemeType>(() => {
    if (isDark()) return 'dark';
    if (isLight()) return 'light';
    return 'no-preference';
  });
}
