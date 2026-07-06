import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { MaybeComputedRefArgs } from '../utils';
import { computed } from '@angular/core';
import { toValueArgsFlat } from '../utils';

export function useAverage(
  array: SignalOrValue<SignalOrValue<number>[]>,
): ReturnType<typeof computed<number>>;
export function useAverage(...args: SignalOrValue<number>[]): ReturnType<typeof computed<number>>;

/**
 * Get the average of an array reactively
 *
 * @see https://vueuse.org/useAverage
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useAverage(
  ...args: MaybeComputedRefArgs<number>
): ReturnType<typeof computed<number>> {
  return computed(() => {
    const array = toValueArgsFlat(args);
    return array.reduce((sum, v) => (sum += v), 0) / array.length;
  });
}
