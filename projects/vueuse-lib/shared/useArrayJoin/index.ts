import { computed } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { resolveAll, toValue } from '../utils/general';

export type UseArrayJoinReturn = ReturnType<typeof computed>;

/**
 * Reactive `Array.join`
 */
export function useArrayJoin<T>(
  list: SignalOrValue<SignalOrValue<T>[]>,
  separator?: SignalOrValue<string>,
): UseArrayJoinReturn {
  return computed(() => {
    const resolved = resolveAll<T>(toValue(list));
    return resolved.join(toValue(separator) ?? ',');
  });
}
