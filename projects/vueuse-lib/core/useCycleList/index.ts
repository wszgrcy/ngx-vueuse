import type { Signal, WritableSignal } from '@angular/core';
import { computed, signal } from '@angular/core';
import { toRef } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';

type MaybeRefOrGetter<T> = T | (() => T);

export interface UseCycleListOptions<T> {
  /**
   * The initial value of the state.
   * A signal can be provided to reuse.
   */
  initialValue?: MaybeRefOrGetter<T>;

  /**
   * The default index when
   */
  fallbackIndex?: number;

  /**
   * Custom function to get the index of the current value.
   */
  getIndexOf?: (value: T, list: T[]) => number;
}

export interface UseCycleListReturn<T> {
  state: WritableSignal<T | undefined>;
  index: Signal<number> & { set: (v: number) => void };
  next: (n?: number) => T;
  prev: (n?: number) => T;
  /**
   * Go to a specific index
   */
  go: (i: number) => T;
}

/**
 * Cycle through a list of items
 *
 * @see https://vueuse.org/useCycleList
 */
export function useCycleList<T>(
  list: MaybeRefOrGetter<T[]>,
  options?: UseCycleListOptions<T>,
): UseCycleListReturn<T> {
  const state = signal<T | undefined>(getInitialValue());
  const listSignal: Signal<T[]> = toRef(list) as Signal<T[]>;

  function set(i: number) {
    const targetList = listSignal();
    const length = targetList.length;
    const idx = ((i % length) + length) % length;
    const value = targetList[idx];
    state.set(value);
    return value;
  }

  const index = computed(() => {
    const targetList = listSignal();
    const stateVal = state();

    let idx = options?.getIndexOf
      ? options.getIndexOf(stateVal as T, targetList)
      : targetList.indexOf(stateVal as T);

    if (idx < 0) idx = options?.fallbackIndex ?? 0;

    return idx;
  }) as Signal<number> & { set: (v: number) => void };

  // Add set method to computed
  index['set'] = function (v: number) {
    set(v);
  };

  function shift(delta = 1) {
    return set(index() + delta);
  }

  function next(n = 1) {
    return shift(n);
  }

  function prev(n = 1) {
    return shift(-n);
  }

  function getInitialValue() {
    const resolvedList = toValue<T[]>(list as MaybeRefOrGetter<T[]>);
    return toValue(options?.initialValue ?? resolvedList[0]) ?? undefined;
  }

  watch(listSignal, () => set(index()));

  return {
    state,
    index,
    next,
    prev,
    go: set,
  };
}
