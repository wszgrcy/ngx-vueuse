/**
 * Reactive online state.
 *
 * Ported from VueUse useOnline
 * @see https://vueuse.org/useOnline
 */

import type { ConfigurableWindow } from '../_configurable';
import { useNetwork } from '../useNetwork';

/**
 * Reactive online state.
 *
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useOnline(options: ConfigurableWindow = {}) {
  const { isOnline } = useNetwork(options);
  return isOnline;
}
