import type { Signal } from '@angular/core';
import type { UseRefHistoryOptions, UseRefHistoryReturn } from '../useRefHistory';
import { debounceFilter } from '@cyia/ngx-vueuse/shared';
import { useRefHistory } from '../useRefHistory';
import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';

/**
 * Shorthand for [useRefHistory](https://vueuse.org/useRefHistory) with debounce filter.
 *
 * @see https://vueuse.org/useDebouncedRefHistory
 * @param source
 * @param options
 */
export function useDebouncedRefHistory<Raw, Serialized = Raw>(
  source: Signal<Raw>,
  options: Omit<UseRefHistoryOptions<Raw, Serialized>, 'eventFilter'> & {
    debounce?: SignalOrValue<number>;
  } = {},
): UseRefHistoryReturn<Raw, Serialized> {
  const filter = options.debounce ? debounceFilter(options.debounce) : undefined;
  const history = useRefHistory(source, { ...options, eventFilter: filter });

  return {
    ...history,
  };
}
