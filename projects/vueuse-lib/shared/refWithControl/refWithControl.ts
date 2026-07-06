import { signal } from '@angular/core';
import { extendRef } from '../extendRef/extendRef';

export interface ControlledRefOptions<T> {
  /**
   * Callback function before the ref changing.
   *
   * Returning `false` to dismiss the change.
   */
  onBeforeChange?: (value: T, oldValue: T) => void | boolean;

  /**
   * Callback function after the ref changed
   *
   * This happens synchronously, with less overhead compare to `watch`
   */
  onChanged?: (value: T, oldValue: T) => void;
}

/**
 * Fine-grained controls over signal and its reactivity.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function refWithControl<T>(initial: T, options: ControlledRefOptions<T> = {}) {
  let source = initial;

  const s = signal(initial) as any;

  function get(tracking = true) {
    if (tracking) s(); // Trigger tracking
    return source;
  }

  function set(value: T, triggering = true) {
    if (value === source) return;

    const old = source;
    if (options.onBeforeChange?.(value, old) === false) return; // dismissed

    source = value;

    if (triggering) {
      options.onChanged?.(value, old);
      s.set(value);
    }
  }

  /**
   * Get the value without tracked in the reactivity system
   */
  const untrackedGet = () => get(false);
  /**
   * Set the value without triggering the reactivity system
   */
  const silentSet = (v: T) => set(v, false);

  /**
   * Get the value without tracked in the reactivity system.
   *
   * Alias for `untrackedGet()`
   */
  const peek = () => get(false);

  /**
   * Set the value without triggering the reactivity system
   *
   * Alias for `silentSet(v)`
   */
  const lay = (v: T) => set(v, false);

  return extendRef(
    s,
    {
      get,
      set,
      untrackedGet,
      silentSet,
      peek,
      lay,
    },
    { enumerable: true },
  );
}

/** @deprecated use `refWithControl` instead */
export const controlledRef = refWithControl;
