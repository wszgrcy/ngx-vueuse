import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import { computed } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

/**
 * Reactive `Math.abs`.
 *
 * @see https://vueuse.org/useAbs
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useAbs(value: SignalOrValue<number>): ReturnType<typeof computed<number>> {
  return computed(() => Math.abs(toValue(value)));
}
