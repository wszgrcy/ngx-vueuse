import type { MaybeRefOrGetter, Signal } from '../utils/types';
import { customRef } from '../customRef';
import { toValue } from '../utils/general';
import { tryOnScopeDispose } from '../tryOnScopeDispose';

export type RefAutoResetReturn<T = any> = Signal<T>;

/**
 * Create a ref which will be reset to the default value after some time.
 *
 * @see https://vueuse.org/refAutoReset
 * @param defaultValue The value which will be set.
 * @param afterMs      A zero-or-greater delay in milliseconds.
 */
export function refAutoReset<T>(
  defaultValue: MaybeRefOrGetter<T>,
  afterMs: MaybeRefOrGetter<number> = 10000,
): RefAutoResetReturn<T> {
  return customRef<T>((track, trigger) => {
    let value: T = toValue(defaultValue);
    let timer: ReturnType<typeof setTimeout>;

    const resetAfter = () =>
      setTimeout(() => {
        value = toValue(defaultValue);
        trigger();
      }, toValue(afterMs));

    tryOnScopeDispose(() => {
      clearTimeout(timer);
    });

    return {
      get() {
        track();
        return value;
      },
      set(newValue) {
        value = newValue;
        trigger();

        clearTimeout(timer);
        timer = resetAfter();
      },
    };
  });
}

/** @deprecated use `refAutoReset` instead */
export const autoResetRef = refAutoReset;
