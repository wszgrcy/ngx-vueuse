import type { AnyFn } from '../utils/types';

export type CreateGlobalStateReturn<Fn extends AnyFn = AnyFn> = Fn;

/**
 * Keep states in the global scope to be reusable across Vue instances.
 *
 * @see https://vueuse.org/createGlobalState
 * @param stateFactory A factory function to create the state
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createGlobalState<Fn extends AnyFn>(stateFactory: Fn): CreateGlobalStateReturn<Fn> {
  let initialized = false;
  let state: any;

  return ((...args: any[]) => {
    if (!initialized) {
      state = stateFactory(...args);
      initialized = true;
    }
    return state;
  }) as Fn;
}
