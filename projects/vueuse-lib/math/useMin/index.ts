import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { MaybeComputedRefArgs } from '../utils';
import { computed } from '@angular/core';
import { toValueArgsFlat } from '../utils';

export function useMin(
  array: SignalOrValue<SignalOrValue<number>[]>,
): ReturnType<typeof computed<number>>;
export function useMin(...args: SignalOrValue<number>[]): ReturnType<typeof computed<number>>;

/**
 * Reactive `Math.min`.
 *
 * @see https://vueuse.org/useMin
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useMin(...args: MaybeComputedRefArgs<number>) {
  return computed<number>(() => {
    const array = toValueArgsFlat(args);
    return Math.min(...array);
  });
}
