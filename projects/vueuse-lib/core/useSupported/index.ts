import { computed, type Signal } from '@angular/core';
import { useMounted } from '../useMounted';

export type UseSupportedReturn = Signal<boolean>;

/**
 * Check if the current environment is supported for the callback.
 * Returns a computed signal that is true when:
 * 1. The component is mounted
 * 2. The callback returns a truthy value
 */
export function useSupported(callback: () => unknown): UseSupportedReturn {
  const isMounted = useMounted();

  return computed(() => {
    // to trigger the signal
    isMounted();
    return Boolean(callback());
  });
}
