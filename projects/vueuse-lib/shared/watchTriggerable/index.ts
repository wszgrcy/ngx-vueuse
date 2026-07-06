import type { Signal } from '@angular/core';
import { isSignal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { toValue } from '../utils/general';


export interface WatchTriggerableReturn<FnReturnT = void> {
  /** Execute `WatchCallback` immediately */
  trigger: () => FnReturnT;
  /** Stop the watcher */
  stop: () => void;
  /** Update the source without triggering effects */
  ignoreUpdates: (updater: () => void) => void;
  /** Ignore previous async updates */
  ignorePrevAsyncUpdates: () => void;
}

type OnCleanup = (cleanupFn: () => void) => void;

export type WatchTriggerableCallback<V = any, OV = any, R = void> = (
  value: V,
  oldValue: OV,
  onCleanup: OnCleanup,
) => R;

export interface WatchTriggerableOptions {
  immediate?: boolean;
  deep?: boolean;
}

type WatchSource<T> = Signal<T> | (() => T);

type MapSources<T> = {
  [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never;
};

type MapOldSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true
      ? V | undefined
      : V
    : never;
};

export function watchTriggerable<T, FnReturnT = void>(
  source: WatchSource<T>,
  cb: WatchTriggerableCallback<T, T | undefined, FnReturnT>,
  options?: WatchTriggerableOptions,
): WatchTriggerableReturn<FnReturnT>;

export function watchTriggerable<T extends Readonly<WatchSource<any>>[], FnReturnT = void>(
  sources: [...T],
  cb: WatchTriggerableCallback<MapSources<T>, MapOldSources<T, false>, FnReturnT>,
  options?: WatchTriggerableOptions,
): WatchTriggerableReturn<FnReturnT>;

export function watchTriggerable<T extends object, FnReturnT = void>(
  source: T,
  cb: WatchTriggerableCallback<T, T | undefined, FnReturnT>,
  options?: WatchTriggerableOptions,
): WatchTriggerableReturn<FnReturnT>;

export function watchTriggerable<FnReturnT = void>(
  source: any,
  cb: any,
  options: WatchTriggerableOptions = {},
): WatchTriggerableReturn {
  let cleanupFn: (() => void) | undefined;
  let oldValue: any;

  function onEffect() {
    if (!cleanupFn) return;

    const fn = cleanupFn;
    cleanupFn = undefined;
    fn();
  }

  /** Register the function `cleanupFn` */
  function onCleanup(callback: () => void) {
    cleanupFn = callback;
  }

  const _cb = (value: any, oldValue: any) => {
    // When a new side effect occurs, clean up the previous side effect
    onEffect();

    return cb(value, oldValue, onCleanup);
  };

  function getWatchSources(src: any): any {
    if (isSignal(src)) return src();
    if (typeof src === 'function') return src();
    if (Array.isArray(src)) return src.map((s: any) => toValue(s));
    // Reactive object: return the whole object (Angular signals inside will be tracked in effect)
    if (typeof src === 'object' && src !== null) return src;
    return toValue(src);
  }

  // For calls triggered by trigger, the old value is unknown, so it cannot be returned
  function getOldValue(src: any): any {
    return Array.isArray(src) ? src.map(() => undefined) : undefined;
  }

  // Try to create a watch, but gracefully handle if not in injection context
  let stopEffectFn: () => void = () => {};
  try {
    const eff = watch(
      () => getWatchSources(source),
      ([value]) => {
        const result = _cb(value, oldValue);
        oldValue = value;
        return result;
      },
      options as any,
    );
    stopEffectFn = () => eff();
  } catch {
    // Not in injection context - just execute once
    const value = getWatchSources(source);
    _cb(value, undefined);
  }

  let ignore = false;

  const ignoreUpdates = (updater: () => void) => {
    ignore = true;
    updater();
    ignore = false;
  };

  const ignorePrevAsyncUpdates = () => {
    // no op for sync
  };

  const trigger = () => {
    let res: any;
    ignoreUpdates(() => {
      res = _cb(getWatchSources(source), getOldValue(source));
    });
    return res;
  };

  return {
    stop: stopEffectFn,
    ignoreUpdates,
    ignorePrevAsyncUpdates,
    trigger,
  } as WatchTriggerableReturn<FnReturnT>;
}
