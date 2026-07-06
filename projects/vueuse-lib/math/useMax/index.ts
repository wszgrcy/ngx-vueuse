import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { MaybeComputedRefArgs } from '../utils';
import { computed } from '@angular/core';
import { toValueArgsFlat } from '../utils';

export function useMax(
  array: SignalOrValue<SignalOrValue<number>[]>,
): ReturnType<typeof computed<number>>;
export function useMax(...args: SignalOrValue<number>[]): ReturnType<typeof computed<number>>;

/**
 * Reactively get maximum of values.
 *
 * @see https://vueuse.org/useMax
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useMax(...args: MaybeComputedRefArgs<number>) {
  return computed<number>(() => {
    const array = toValueArgsFlat(args);
    return Math.max(...array);
  });
}
