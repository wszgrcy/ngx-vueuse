import { type Signal, signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import type { SignalOrGetter } from '../utils/types';
import { timestamp } from '../utils/is';

export interface UseLastChangedOptions<
  Immediate extends boolean,
  InitialValue extends number | null | undefined = undefined,
> {
  initialValue?: InitialValue;
  immediate?: Immediate;
}

export type UseLastChangedReturn = Signal<number | null> | Signal<number>;

/**
 * Records the timestamp of the last change
 *
 * @see https://vueuse.org/useLastChanged
 */
export function useLastChanged(
  source: SignalOrGetter<any>,
  options?: UseLastChangedOptions<false>,
): Signal<number | null>;
export function useLastChanged(
  source: SignalOrGetter<any>,
  options: UseLastChangedOptions<true> | UseLastChangedOptions<boolean, number>,
): Signal<number>;
export function useLastChanged(
  source: SignalOrGetter<any>,
  options: UseLastChangedOptions<boolean, any> = {},
): UseLastChangedReturn {
  const ms = signal<number | null>(options.initialValue ?? null);

  watch(source, () => ms.set(timestamp()), options);

  return ms as UseLastChangedReturn;
}
