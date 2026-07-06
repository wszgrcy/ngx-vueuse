import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import { computed } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

/**
 * Reactive `Math.round`.
 *
 * @see https://vueuse.org/useRound
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useRound(value: SignalOrValue<number>): ReturnType<typeof computed<number>> {
  return computed<number>(() => Math.round(toValue(value)));
}
