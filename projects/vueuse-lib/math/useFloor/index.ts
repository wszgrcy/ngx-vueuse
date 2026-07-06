import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import { computed } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

/**
 * Reactive `Math.floor`
 *
 * @see https://vueuse.org/useFloor
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useFloor(value: SignalOrValue<number>): ReturnType<typeof computed<number>> {
  return computed<number>(() => Math.floor(toValue(value)));
}
