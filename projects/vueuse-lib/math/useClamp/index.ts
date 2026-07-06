import type { Signal, WritableSignal } from '@angular/core';
import { computed, isSignal, signal, untracked } from '@angular/core';
import { clamp } from '@cyia/ngx-vueuse/shared';

type MaybeSignal<T> = Signal<T> | T;

/**
 * Resolve a maybe-signal value to a plain value.
 */
function toVal<T>(v: MaybeSignal<T>): T {
  return isSignal(v) ? v() : v;
}

/**
 * Reactively clamp a value between two other values.
 *
 * @see https://vueuse.org/useClamp
 * @param value number
 * @param min
 * @param max
 *
 * __NO_SIDE_EFFECTS__
 */
export function useClamp(
  value: Signal<number>,
  min: MaybeSignal<number>,
  max: MaybeSignal<number>,
): Signal<number>;
export function useClamp(
  value: number,
  min: MaybeSignal<number>,
  max: MaybeSignal<number>,
): WritableSignal<number>;

/**
 * Reactively clamp a value between two other values.
 *
 * @see https://vueuse.org/useClamp
 * @param value number
 * @param min
 * @param max
 *
 * __NO_SIDE_EFFECTS__
 */
export function useClamp(
  value: Signal<number> | number,
  min: MaybeSignal<number>,
  max: MaybeSignal<number>,
): Signal<number> | WritableSignal<number> {
  const isSig = isSignal(value);

  if (isSig) {
    return computed(() => clamp(value(), toVal(min), toVal(max)));
  }

  // For non-signal (mutable) input, store the value in a signal
  // and return a computed that clamps on read
  const numValue = value as number;
  const _value = signal(numValue);

  // Track min/max signals if they are signals
  const minIsSig = isSignal(min);
  const maxIsSig = isSignal(max);

  // Create a computed that clamps the stored value based on current min/max
  // This replicates Vue's computed getter behavior (including the side effect of updating _value)
  const clampedValue = computed(() => {
    const newMin = minIsSig ? min() : min;
    const newMax = maxIsSig ? max() : max;
    const clamped = clamp(_value(), newMin, newMax);
    // Replicate Vue's computed getter side effect: update _value when reading
    untracked(() => _value.set(clamped));
    return clamped;
  });

  // Return as WritableSignal - users can call it to read and use .set() to write
  // The .set() method clamps the value, replicating Vue's computed setter
  return Object.assign(clampedValue, {
    set: (v: number) => _value.set(clamp(v, minIsSig ? min() : min, maxIsSig ? max() : max)),
  }) as unknown as WritableSignal<number>;
}
