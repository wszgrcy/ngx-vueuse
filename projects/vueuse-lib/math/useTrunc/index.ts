import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import { computed } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

/**
 * Reactive `Math.trunc`.
 *
 * @see https://vueuse.org/useTrunc
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useTrunc(value: SignalOrValue<number>): ReturnType<typeof computed<number>> {
  return computed<number>(() => Math.trunc(toValue(value)));
}
