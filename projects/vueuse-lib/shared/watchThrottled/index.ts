import type { SignalOrGetter } from '../utils/types';
import { throttleFilter } from '../utils/filters';
import { watchWithFilter, type WatchHandle } from '../watchWithFilter';
import type { WatchCallback } from '../watchDeep';

export interface WatchThrottledOptions<Immediate> {
  throttle?: SignalOrGetter<number>;
  trailing?: boolean;
  leading?: boolean;
  immediate?: Immediate;
  deep?: boolean;
}

export function watchThrottled<T, Immediate extends Readonly<boolean> = false>(
  source: SignalOrGetter<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchThrottledOptions<Immediate>,
): WatchHandle;

export function watchThrottled<
  T extends Readonly<SignalOrGetter<any>>[],
  Immediate extends Readonly<boolean> = false,
>(
  sources: [...T],
  cb: WatchCallback<any, any>,
  options?: WatchThrottledOptions<Immediate>,
): WatchHandle;

export function watchThrottled<T extends object, Immediate extends Readonly<boolean> = false>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchThrottledOptions<Immediate>,
): WatchHandle;

export function watchThrottled<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: any,
  options: WatchThrottledOptions<Immediate> = {},
): WatchHandle {
  const { throttle = 0, trailing = true, leading = true, ...watchOptions } = options;

  return watchWithFilter(source, cb, {
    ...watchOptions,
    eventFilter: throttleFilter(throttle as any, trailing, leading),
  } as any);
}

/** @deprecated use `watchThrottled` instead */
export const throttledWatch = watchThrottled;
