/**
 * The source code for this function was inspired by vue-apollo's `useEventHook` util
 * https://github.com/vuejs/vue-apollo/blob/v4/packages/vue-apollo-composable/src/util/useEventHook.ts
 */

import { inject } from '@angular/core';
import { DestroyRef } from '@angular/core';

// so we need to check if T is any first
type Callback<T> =
  IsAny<T> extends true
    ? (...param: any) => void
    : [T] extends [void]
      ? (...param: unknown[]) => void
      : [T] extends [any[]]
        ? (...param: T) => void
        : (...param: [T, ...unknown[]]) => void;

type IsAny<T> = 0 extends 1 & T ? true : false;

export type EventHookOn<T = any> = (fn: Callback<T>) => { off: () => void };
export type EventHookOff<T = any> = (fn: Callback<T>) => void;
export type EventHookTrigger<T = any> = (...param: Parameters<Callback<T>>) => Promise<unknown[]>;

export interface EventHook<T = any> {
  on: EventHookOn<T>;
  off: EventHookOff<T>;
  trigger: EventHookTrigger<T>;
  clear: () => void;
}

export type EventHookReturn<T> = EventHook<T>;

/**
 * Utility for creating event hooks.
 *
 * When called within an Angular injection context (e.g., inside a component),
 * the returned `clear()` method is also automatically called on component destruction,
 * ensuring all event listeners are cleaned up to prevent memory leaks.
 *
 * @see https://vueuse.org/createEventHook
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createEventHook<T = any>(): EventHookReturn<T> {
  const fns: Set<Callback<T>> = new Set();

  const off = (fn: Callback<T>) => {
    fns.delete(fn);
  };

  const clear = () => {
    fns.clear();
  };

  const on = (fn: Callback<T>) => {
    fns.add(fn);
    const offFn = () => off(fn);

    // Register automatic cleanup via destroyRef when in injection context.
    // This matches VueUse's tryOnScopeDispose(offFn) behavior.
    try {
      const destroyRef = inject(DestroyRef);
      destroyRef.onDestroy(offFn);
    } catch {
      // Not in injection context — no automatic cleanup
    }

    return {
      off: offFn,
    };
  };

  const trigger: EventHookTrigger<T> = (...args) =>
    Promise.all(Array.from(fns).map((fn) => fn(...args)));

  return {
    on,
    off,
    trigger,
    clear,
  };
}
