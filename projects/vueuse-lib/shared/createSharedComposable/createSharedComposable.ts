import type { AnyFn } from '../utils';
import { isClient } from '../utils/is';
import { tryOnScopeDispose } from '../tryOnScopeDispose';

export type SharedComposableReturn<T extends AnyFn = AnyFn> = T;

/**
 * Make a composable function usable with multiple Angular components.
 *
 * @see https://vueuse.org/createSharedComposable
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createSharedComposable<Fn extends AnyFn>(
  composable: Fn,
): SharedComposableReturn<Fn> {
  if (!isClient) return composable;

  let subscribers = 0;
  let state: ReturnType<Fn> | undefined;

  const dispose = () => {
    subscribers -= 1;
    if (subscribers <= 0) {
      state = undefined;
    }
  };

  return <Fn>((...args) => {
    subscribers += 1;
    if (state === undefined) {
      state = composable(...args);
    }
    tryOnScopeDispose(dispose);
    return state;
  });
}
