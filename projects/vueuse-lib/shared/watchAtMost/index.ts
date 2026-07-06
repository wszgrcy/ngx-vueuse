import type { SignalOrGetter } from '../utils/types';
import { signal, type Signal } from '@angular/core';
import { toValue } from '../utils/general';
import { watchWithFilter } from '../watchWithFilter';
import type { WatchCallback } from '../watchDeep';

export interface WatchAtMostOptions<Immediate> {
  count: SignalOrGetter<number>;
  eventFilter?: any;
  immediate?: Immediate;
  deep?: boolean;
}

export interface WatchAtMostReturn {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  count: Signal<number>;
}

export function watchAtMost<T, Immediate extends Readonly<boolean> = false>(
  source: SignalOrGetter<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options: WatchAtMostOptions<Immediate>,
): WatchAtMostReturn;

export function watchAtMost<
  T extends Readonly<SignalOrGetter<any>>[],
  Immediate extends Readonly<boolean> = false,
>(
  sources: [...T],
  cb: WatchCallback<any, any>,
  options: WatchAtMostOptions<Immediate>,
): WatchAtMostReturn;

export function watchAtMost<T extends object, Immediate extends Readonly<boolean> = false>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options: WatchAtMostOptions<Immediate>,
): WatchAtMostReturn;

export function watchAtMost<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: any,
  options: WatchAtMostOptions<Immediate>,
): WatchAtMostReturn {
  const { count, ...watchOptions } = options;

  const current = signal(0);

  const watchHandle = watchWithFilter(
    source,
    (...args: any[]) => {
      current.set(current() + 1);
      if (current() >= toValue(count)) {
        // Schedule stop after current callback (Angular doesn't have nextTick, use queueMicrotask)
        queueMicrotask(() => watchHandle.stop());
      }

      cb(...args);
    },
    watchOptions as any,
  );

  return {
    count: current,
    stop: watchHandle.stop,
    pause: watchHandle.pause,
    resume: watchHandle.resume,
  };
}
