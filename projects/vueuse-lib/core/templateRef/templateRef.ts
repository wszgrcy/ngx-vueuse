import type { Signal } from '@angular/core';
import { signal } from '@angular/core';

/**
 * @deprecated Angular does not support dynamic template refs like Vue.
 * Use Angular's built-in `viewChild()`, `viewChildren()`, `templateRef`, or `templateRefs` instead.
 *
 * This is a placeholder implementation. Angular components are static and cannot
 * dynamically bind template references like Vue's templateRef.
 *
 * @see https://vueuse.org/templateRef
 * @param key (unused) The template reference key (Angular doesn't use this)
 * @param initialValue Initial value when the template reference is not yet available
 *
 * @__NO_SIDE_EFFECTS__
 */
export function templateRef<T = any>(
  key?: string,
  initialValue: T | null = null,
): Signal<T | null> {
  // NOTE: This is a placeholder implementation.
  // Angular does not support dynamic template refs like Vue.
  // Use Angular's built-in viewChild() or templateRef() instead.
  return signal<T | null>(initialValue as T | null);
}
