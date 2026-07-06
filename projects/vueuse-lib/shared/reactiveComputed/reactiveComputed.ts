import { computed } from '@angular/core';
import { toReactive } from '../toReactive';

export type ReactiveComputedReturn<T extends object> = T;

/**
 * Computed reactive object.
 */
export function reactiveComputed<T extends object>(fn: () => T): ReactiveComputedReturn<T> {
  return toReactive<T>(computed(fn));
}
