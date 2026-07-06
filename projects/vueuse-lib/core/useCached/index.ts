import type { Signal } from '@angular/core';
import type { ConfigurableDeepRefs } from '../_configurable';
import { createRef } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';

export interface UseCachedOptions<D extends boolean = true> extends ConfigurableDeepRefs<D> {}

export function useCached<T, D extends boolean = true>(
  refValue: Signal<T>,
  comparator: (newSourceValue: T, cachedValue: T) => boolean = (newSourceValue, cachedValue) =>
    newSourceValue === cachedValue,
  options?: UseCachedOptions<D>,
): UseCachedReturn<T, D> {
  const { deepRefs = true as D } = options || {};
  const cachedValue = createRef(refValue(), deepRefs) as any;

  watch(
    () => refValue(),
    (value: T) => {
      if (!comparator(value, cachedValue())) cachedValue.set(value);
    },
  );

  return cachedValue;
}

export type UseCachedReturn<T = any, D extends boolean = true> = Signal<T>;
