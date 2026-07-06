import type { SignalOrGetter } from '../utils/types';
import type { ConfigurableEventFilter } from '../utils/filters';
import { watch } from '@cyia/ngx-vueuse/patch';
import type { WatchHandle } from '@cyia/ngx-vueuse/patch';
import { bypassFilter, createFilterWrapper } from '../utils/filters';
import { untracked } from '@angular/core';

export type { WatchHandle };

export interface WatchWithFilterOptions<Immediate> extends ConfigurableEventFilter {
  immediate?: Immediate;
  deep?: boolean;
  flush?: 'pre' | 'post' | 'sync';
}

export function watchWithFilter<T, Immediate extends Readonly<boolean> = false>(
  source: SignalOrGetter<T>,
  cb: (value: T, oldValue: Immediate extends true ? T | undefined : T) => void,
  options?: WatchWithFilterOptions<Immediate>,
): WatchHandle;

export function watchWithFilter<
  T extends Readonly<SignalOrGetter<any>>[],
  Immediate extends Readonly<boolean> = false,
>(
  sources: [...T],
  cb: (...args: any[]) => void,
  options?: WatchWithFilterOptions<Immediate>,
): WatchHandle;

export function watchWithFilter<T extends object, Immediate extends Readonly<boolean> = false>(
  source: T,
  cb: (value: T, oldValue: Immediate extends true ? T | undefined : T) => void,
  options?: WatchWithFilterOptions<Immediate>,
): WatchHandle;

export function watchWithFilter<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: any,
  options: WatchWithFilterOptions<Immediate> = {},
): WatchHandle {
  const { eventFilter = bypassFilter, ...watchOptions } = options;

  return watch(
    source,
    (...args: any[]) => untracked(() => createFilterWrapper(eventFilter, cb)(...args)),
    watchOptions as Parameters<typeof watch>[2],
  );
}
