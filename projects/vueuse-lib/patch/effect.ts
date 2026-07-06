import { CreateEffectOptions, EffectCleanupRegisterFn, signal } from '@angular/core';
import { syncEffect } from './sync-effect';
import { WatchHandle } from './watch';

/**
 * 不支持 flush，因此如果是sync的，那么就需要等待一个微任务
 */
export function watchEffect<T>(
  fn: (onCleanup: EffectCleanupRegisterFn) => T,
  options?: CreateEffectOptions,
): WatchHandle {
  const needStop = signal(false);
  const oldFn = fn;
  const fn2 = (onCleanup: EffectCleanupRegisterFn) => {
    if (needStop()) {
      return;
    }
    oldFn(onCleanup);
  };

  const ref = syncEffect(fn2, options);

  const handle = () => ref.destroy();
  (handle as any)['stop'] = () => ref.destroy();
  (handle as any)['pause'] = () => needStop.set(true);
  (handle as any)['resume'] = () => needStop.set(false);
  return handle as WatchHandle;
}
