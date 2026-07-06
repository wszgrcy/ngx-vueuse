import { createRef } from '@cyia/ngx-vueuse/shared';
import type { ShallowOrDeepRef } from '@cyia/ngx-vueuse/shared';
import { watchDeep } from '@cyia/ngx-vueuse/shared';
import type { WatchDeepOptions } from '@cyia/ngx-vueuse/shared';
import type { WritableSignal } from '@angular/core';

export interface UseCachedOptions extends WatchDeepOptions {}

export function useCached<T>(
  refValue: () => T,
  comparator: (newSourceValue: T, cachedValue: T) => boolean = (newSourceValue, cachedValue) =>
    newSourceValue === cachedValue,
  options?: UseCachedOptions,
): WritableSignal<T> {
  const { ...watchOptions } = (options || {}) as any;
  const cachedValue = createRef(refValue()) as WritableSignal<T>;
  watchDeep(
    refValue,
    (values) => {
      const value = values;
      if (!comparator(value, cachedValue())) cachedValue.set(value);
    },
    watchOptions as WatchDeepOptions,
  );

  return cachedValue;
}

export type UseCachedReturn<T = any> = ShallowOrDeepRef<T>;
