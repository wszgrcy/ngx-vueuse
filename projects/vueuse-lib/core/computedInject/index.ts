import type { Signal } from '@angular/core';
import { computed, inject, InjectionToken } from '@angular/core';

export type ComputedInjectGetter<T, K> = (source: T | undefined, oldValue?: K) => K;
export type ComputedInjectGetterWithDefault<T, K> = (source: T, oldValue?: K) => K;
export type ComputedInjectSetter<T> = (v: T) => void;

export interface WritableComputedInjectOptions<T, K> {
  get: ComputedInjectGetter<T, K>;
  set: ComputedInjectSetter<K>;
}

export interface WritableComputedInjectOptionsWithDefault<T, K> {
  get: ComputedInjectGetterWithDefault<T, K>;
  set: ComputedInjectSetter<K>;
}

export function computedInject<T, K = unknown>(
  key: InjectionToken<T> | string,
  getter: ComputedInjectGetter<T, K>,
): Signal<K | undefined>;
export function computedInject<T, K = unknown>(
  key: InjectionToken<T> | string,
  options: WritableComputedInjectOptions<T, K>,
): Signal<K | undefined>;
export function computedInject<T, K = unknown>(
  key: InjectionToken<T> | string,
  getter: ComputedInjectGetterWithDefault<T, K>,
  defaultSource: T,
  treatDefaultAsFactory?: false,
): Signal<K>;
export function computedInject<T, K = unknown>(
  key: InjectionToken<T> | string,
  options: WritableComputedInjectOptionsWithDefault<T, K>,
  defaultSource: T | (() => T),
  treatDefaultAsFactory: true,
): Signal<K>;
export function computedInject<T, K = unknown>(
  key: InjectionToken<T> | string,
  options: ComputedInjectGetter<T, K> | WritableComputedInjectOptions<T, K>,
  defaultSource?: T | (() => T),
  treatDefaultAsFactory?: boolean,
) {
  let source: T | undefined;
  if (key instanceof InjectionToken) {
    source = inject(key as InjectionToken<T>, { optional: true }) as T | undefined;
  }
  if (defaultSource) {
    if (treatDefaultAsFactory) {
      source = (defaultSource as () => T)();
    } else if (source === undefined) {
      source = defaultSource as T;
    }
  }

  if (typeof options === 'function') {
    return computed(() => options(source as T, undefined as K | undefined));
  } else {
    return computed(() => options.get(source as T, undefined as K | undefined));
  }
}
