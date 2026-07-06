import { computed, type Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { useMediaQuery } from '../useMediaQuery';

export type ContrastType = 'more' | 'less' | 'custom' | 'no-preference';

/**
 * Reactive prefers-contrast media query.
 *
 * @see https://vueuse.org/usePreferredContrast
 * @param [options]
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePreferredContrast(options?: ConfigurableWindow): Signal<ContrastType> {
  const isMore = useMediaQuery('(prefers-contrast: more)', options);
  const isLess = useMediaQuery('(prefers-contrast: less)', options);
  const isCustom = useMediaQuery('(prefers-contrast: custom)', options);

  return computed<ContrastType>(() => {
    if (isMore()) return 'more';
    if (isLess()) return 'less';
    if (isCustom()) return 'custom';
    return 'no-preference';
  });
}
