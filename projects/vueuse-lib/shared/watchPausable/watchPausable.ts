import type { SignalOrGetter } from '../utils/types';
import type { Pausable, PausableFilterOptions } from '../utils/filters';
import type { WatchWithFilterOptions } from '../watchWithFilter';
import { pausableFilter } from '../utils/filters';
import { watchWithFilter } from '../watchWithFilter';

export interface WatchPausableReturn extends Pausable {
  stop: () => void;
}

export type WatchPausableOptions<Immediate> = WatchWithFilterOptions<Immediate> &
  PausableFilterOptions;

/** @deprecated Use Angular's effect or watch instead. This function will be removed in future version. */
export function watchPausable<T, Immediate extends Readonly<boolean> = false>(
  source: SignalOrGetter<T>,
  cb: (value: T, oldValue?: Immediate extends true ? T | undefined : T) => void,
  options?: WatchPausableOptions<Immediate>,
): WatchPausableReturn;

/** @deprecated Use Angular's effect or watch instead. This function will be removed in future version. */
export function watchPausable<
  T extends Readonly<SignalOrGetter<any>>[],
  Immediate extends Readonly<boolean> = false,
>(
  sources: [...T],
  cb: (...args: any[]) => void,
  options?: WatchPausableOptions<Immediate>,
): WatchPausableReturn;

/** @deprecated Use Angular's effect or watch instead. This function will be removed in future version. */
export function watchPausable<T extends object, Immediate extends Readonly<boolean> = false>(
  source: T,
  cb: (value: T, oldValue?: Immediate extends true ? T | undefined : T) => void,
  options?: WatchPausableOptions<Immediate>,
): WatchPausableReturn;

/** @deprecated Use Angular's effect or watch instead. This function will be removed in future version. */
export function watchPausable<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: any,
  options: WatchPausableOptions<Immediate> = {},
): WatchPausableReturn {
  const { eventFilter: filter, initialState = 'active', ...watchOptions } = options;

  const { eventFilter, pause, resume, isActive } = pausableFilter(filter, { initialState });
  const stop = watchWithFilter(source, cb, {
    ...watchOptions,
    eventFilter,
  });

  const result: WatchPausableReturn = { stop, pause, resume, isActive };
  return result;
}

/** @deprecated Use Angular's effect or watch instead. This function will be removed in future version. */
export const pausableWatch = watchPausable;
