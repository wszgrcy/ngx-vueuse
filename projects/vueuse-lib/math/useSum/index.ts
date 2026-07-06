import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { MaybeComputedRefArgs } from '../utils';
import { computed } from '@angular/core';
import { toValueArgsFlat } from '../utils';

export function useSum(
  array: SignalOrValue<SignalOrValue<number>[]>,
): ReturnType<typeof computed<number>>;
export function useSum(...args: SignalOrValue<number>[]): ReturnType<typeof computed<number>>;

/**
 * Get the sum of a set of numbers.
 *
 * @see https://vueuse.org/useSum
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useSum(...args: MaybeComputedRefArgs<number>): ReturnType<typeof computed<number>> {
  return computed(() => toValueArgsFlat(args).reduce((sum, v) => (sum += v), 0));
}
