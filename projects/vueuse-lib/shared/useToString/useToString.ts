import { computed, type Signal } from '@angular/core';
import { toValue } from '../utils/general';
import type { MaybeRefOrGetter } from '../utils/types';

/**
 * Reactively convert a ref to string.
 *
 * @see https://vueuse.org/useToString
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useToString(value: MaybeRefOrGetter<unknown>): Signal<string> {
  return computed(() => `${toValue(value)}`);
}
