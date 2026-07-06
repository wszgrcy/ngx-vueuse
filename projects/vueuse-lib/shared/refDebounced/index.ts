import { signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import type { SignalOrGetter } from '../utils/types';
import type { DebounceFilterOptions } from '../utils/filters';
import { useDebounceFn } from '../useDebounceFn';
import { toValue } from '../utils/general';

export type RefDebouncedReturn<T = any> = Signal<T>;

/**
 * Debounce updates of a ref.
 *
 * @return A new debounced ref.
 */
export function refDebounced<T>(
  value: Signal<T> | T,
  ms: SignalOrGetter<number> = 200,
  options: DebounceFilterOptions = {},
): RefDebouncedReturn<T> {
  const debounced = signal(toValue(value) as T);

  const updater = useDebounceFn(
    () => {
      debounced.set(toValue(value) as T);
    },
    toValue(ms),
    options,
  );

  try {
    // Watch for changes (equivalent to Vue's watch(value, () => updater()))
    watch(value as () => T, () => updater()) as any;
  } catch {
    // Not in injection context - just set once
  }

  return debounced as RefDebouncedReturn<T>;
}

/** @deprecated use `refDebounced` instead */
export const debouncedRef = refDebounced;
/** @deprecated use `refDebounced` instead */
export const useDebounce = refDebounced;
