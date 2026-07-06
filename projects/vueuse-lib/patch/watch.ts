import {
  CreateEffectOptions,
  effect as NgEffect,
  EffectCleanupRegisterFn,
  EffectRef,
  computed,
  untracked,
  Signal,
  signal,
} from '@angular/core';
import { syncEffect } from './sync-effect';
import { toValue } from './general';

type WatchSource<T = any> = Signal<T> | (() => T) | T;

type UnwrapSource<S> = S extends Signal<infer V> ? V : S extends () => infer R ? R : S;

type MapSources<T extends readonly any[]> = {
  [K in keyof T]: UnwrapSource<T[K]>;
};

type OldValue<T, Immediate extends boolean> = Immediate extends true ? T | undefined : T;

type SingleCallback<S, Immediate extends boolean> = (
  value: UnwrapSource<S>,
  oldValue: OldValue<UnwrapSource<S>, Immediate>,
  onCleanup: EffectCleanupRegisterFn,
) => any;

type MultiCallback<T extends readonly any[], Immediate extends boolean> = (
  value: MapSources<T>,
  oldValue: OldValue<MapSources<T>, Immediate>,
  onCleanup: EffectCleanupRegisterFn,
) => any;
export type WatchStopHandle = () => void;
export interface WatchHandle extends WatchStopHandle {
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function watch<
  // 👇 关键：const 修饰符让数组推断为只读元组
  const S extends WatchSource | readonly WatchSource[],
  Immediate extends boolean = false,
>(
  source: S,
  fn: S extends readonly any[] ? MultiCallback<S, Immediate> : SingleCallback<S, Immediate>,
  options?: CreateEffectOptions & { immediate?: Immediate; once?: boolean },
): WatchHandle {
  const listen = computed(() =>
    Array.isArray(source) ? source.map((value) => toValue(value)) : toValue(source),
  );
  const oldFn = fn;
  let oldValue: any = undefined;
  const needStop = signal(false);
  let fn2 = (onCleanup: EffectCleanupRegisterFn) => {
    const isStop = needStop();
    if (isStop) {
      return;
    }
    const value = listen();

    untracked(() => {
      oldFn(value as any, oldValue, onCleanup);
    });
    oldValue = value;
  };

  if (options?.once) {
    const oldFn2 = fn2;
    fn2 = (onCleanup: EffectCleanupRegisterFn) => {
      Promise.resolve().then(() => ref.destroy());
      return untracked(() => oldFn2(onCleanup));
    };
  }
  let ref: EffectRef;
  if (!options?.immediate) {
    ref = NgEffect(fn2, options);
  } else {
    ref = syncEffect(fn2, options);
  }
  const handle = () => ref.destroy();
  (handle as any)['stop'] = () => ref.destroy();
  (handle as any)['pause'] = () => needStop.set(true);
  (handle as any)['resume'] = () => needStop.set(false);
  return handle as WatchHandle;
}
