import type { Signal } from '@angular/core';
import { computed } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { useMediaQuery } from '../useMediaQuery';

export type ReducedMotionType = 'reduce' | 'no-preference';

/**
 * Reactive prefers-reduced-motion media query.
 *
 * @see https://vueuse.org/usePreferredReducedMotion
 * @param [options]
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePreferredReducedMotion(options?: ConfigurableWindow): Signal<ReducedMotionType> {
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)', options);

  return computed<ReducedMotionType>(() => {
    if (isReduced()) return 'reduce';
    return 'no-preference';
  });
}
