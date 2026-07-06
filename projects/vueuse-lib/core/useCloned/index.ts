import type { Signal } from '@angular/core';
import { isSignal, signal } from '@angular/core';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';

export interface UseClonedOptions<T = any> {
  /**
   * Custom clone function.
   *
   * By default, it use `JSON.parse(JSON.stringify(value))` to clone.
   */
  clone?: (source: T) => T;

  /**
   * Manually sync the ref
   *
   * @default false
   */
  manual?: boolean;

  /**
   * Watch for nested changes
   *
   * @default true
   */
  deep?: boolean;

  /**
   * Consider the initial value when creating
   *
   * @default true
   */
  immediate?: boolean;
}

export interface UseClonedReturn<T> {
  /**
   * Cloned ref
   */
  cloned: Signal<T>;
  /**
   * Ref indicates whether the cloned data is modified
   */
  isModified: Signal<boolean>;
  /**
   * Sync cloned data with source manually
   */
  sync: () => void;
}

export type CloneFn<F, T = F> = (x: F) => T;

export function cloneFnJSON<T>(source: T): T {
  return JSON.parse(JSON.stringify(source));
}

export function useCloned<T>(
  source: MaybeRefOrGetter<T>,
  options: UseClonedOptions = {},
): UseClonedReturn<T> {
  const cloned = signal({} as T);
  const isModified = signal<boolean>(false);
  let _lastSync = false;

  const {
    manual,
    clone = cloneFnJSON,
    // watch options
    deep = true,
    immediate = true,
  }: {
    manual?: boolean;
    clone?: (value: T) => T;
    deep?: boolean;
    immediate?: boolean;
  } = options;

  watch(cloned, () => {
    if (_lastSync) {
      _lastSync = false;
      return;
    }
    isModified.set(true);
  });

  function sync() {
    _lastSync = true;
    isModified.set(false);

    cloned.set(clone(toValue(source)));
  }

  if (!manual && (isSignal(source) || typeof source === 'function')) {
    watch(source as () => T, sync, { immediate });
  } else {
    sync();
  }

  return { cloned, isModified, sync };
}
