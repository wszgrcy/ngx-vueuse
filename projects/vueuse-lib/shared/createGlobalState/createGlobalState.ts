import type { AnyFn } from '../utils';
import { DestroyRef, inject, runInInjectionContext, Injector } from '@angular/core';

export type CreateGlobalStateReturn<Fn extends AnyFn = AnyFn> = Fn;

/**
 * Keep states in the global scope to be reusable across Angular components.
 *
 * @see https://vueuse.org/createGlobalState
 * @param stateFactory A factory function to create the state
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createGlobalState<Fn extends AnyFn>(stateFactory: Fn): CreateGlobalStateReturn<Fn> {
  const injector = inject(Injector);
  const destroyRef = inject(DestroyRef);
  let initialized = false;
  let state: any;

  const fn = ((...args: any[]) => {
    if (!initialized) {
      state = runInInjectionContext(injector, () => stateFactory(...args));
      initialized = true;
    }
    return state;
  }) as Fn;

  // Clean up on destroy (for testing purposes)
  destroyRef.onDestroy(() => {
    initialized = false;
    state = undefined;
  });

  return fn;
}
