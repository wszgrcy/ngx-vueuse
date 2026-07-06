import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import { computed } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

/**
 * Reactive `Math.ceil`.
 *
 * @see https://vueuse.org/useCeil
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useCeil(value: SignalOrValue<number>): ReturnType<typeof computed<number>> {
  return computed<number>(() => Math.ceil(toValue(value)));
}
