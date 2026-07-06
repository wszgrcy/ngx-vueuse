import { computed, type Signal } from '@angular/core';
import { useMediaQuery } from '../useMediaQuery';

export type ReducedTransparencyType = 'reduce' | 'no-preference';

/**
 * Reactive prefers-reduced-transparency media query.
 *
 * @see https://vueuse.org/usePreferredReducedTransparency
 * @param [options]
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePreferredReducedTransparency(
  options?: Parameters<typeof useMediaQuery>[1],
): Signal<ReducedTransparencyType> {
  const isReduced = useMediaQuery('(prefers-reduced-transparency: reduce)', options);

  return computed<ReducedTransparencyType>(() => {
    if (isReduced()) return 'reduce';
    return 'no-preference';
  });
}
