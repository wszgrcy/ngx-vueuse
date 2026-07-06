import type { SignalOrGetter } from '../utils/types';
import type { DebounceFilterOptions, SignalOrValue } from '../utils/filters';
import { debounceFilter } from '../utils/filters';
import { watchWithFilter, type WatchHandle } from '../watchWithFilter';

export interface WatchDebouncedOptions<Immediate> extends DebounceFilterOptions {
  debounce?: SignalOrValue<number>;
  immediate?: Immediate;
  deep?: boolean;
}

export function watchDebounced<T, Immediate extends Readonly<boolean> = false>(
  source: SignalOrGetter<T>,
  cb: (value: T, oldValue?: Immediate extends true ? T | undefined : T) => void,
  options?: WatchDebouncedOptions<Immediate>,
): WatchHandle;

export function watchDebounced<
  T extends Readonly<SignalOrGetter<any>>[],
  Immediate extends Readonly<boolean> = false,
>(
  sources: [...T],
  cb: (...args: any[]) => void,
  options?: WatchDebouncedOptions<Immediate>,
): WatchHandle;

export function watchDebounced<T extends object, Immediate extends Readonly<boolean> = false>(
  source: T,
  cb: (value: T, oldValue?: Immediate extends true ? T | undefined : T) => void,
  options?: WatchDebouncedOptions<Immediate>,
): WatchHandle;

export function watchDebounced<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: any,
  options: WatchDebouncedOptions<Immediate> = {},
): WatchHandle {
  const { debounce = 0, maxWait = undefined, ...watchOptions } = options;

  return watchWithFilter(source, cb, {
    ...watchOptions,
    eventFilter: debounceFilter(debounce, { maxWait }),
  });
}

/** @deprecated use `watchDebounced` instead */
export const debouncedWatch = watchDebounced;
