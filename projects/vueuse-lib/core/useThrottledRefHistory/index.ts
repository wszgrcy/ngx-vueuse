import type { Signal } from '@angular/core';
import type { UseRefHistoryOptions, UseRefHistoryReturn } from '../useRefHistory';
import { throttleFilter } from '@cyia/ngx-vueuse/shared';
import { useRefHistory } from '../useRefHistory';

export type UseThrottledRefHistoryOptions<Raw, Serialized = Raw> = Omit<
  UseRefHistoryOptions<Raw, Serialized>,
  'eventFilter'
> & { throttle?: Signal<number> | number; trailing?: boolean };

export type UseThrottledRefHistoryReturn<Raw, Serialized = Raw> = UseRefHistoryReturn<
  Raw,
  Serialized
>;

/**
 * Shorthand for [useRefHistory](https://vueuse.org/useRefHistory) with throttled filter.
 *
 * @see https://vueuse.org/useThrottledRefHistory
 * @param source
 * @param options
 */
export function useThrottledRefHistory<Raw, Serialized = Raw>(
  source: Signal<Raw>,
  options: UseThrottledRefHistoryOptions<Raw, Serialized> = {},
): UseThrottledRefHistoryReturn<Raw, Serialized> {
  const { throttle = 200, trailing = true } = options;
  const filter = throttleFilter(throttle, trailing);
  const history = useRefHistory(source, { ...options, eventFilter: filter });

  return {
    ...history,
  };
}
