import {
  CreateEffectOptions,
  effect,
  EffectCleanupRegisterFn,
  EffectCleanupFn,
  computed,
} from '@angular/core';

export function syncEffect<T>(
  fn: (onCleanup: EffectCleanupRegisterFn) => T,
  options?: CreateEffectOptions,
) {
  let cleanup: EffectCleanupFn | undefined;
  let skipInitialRun = true;

  const syncSignal = computed(() => {
    fn((registerFn) => {
      cleanup = registerFn;
    });
  });
  syncSignal();
  return effect((innerOnCleanup) => {
    if (skipInitialRun) {
      skipInitialRun = false;
      if (cleanup) {
        cleanup();
        cleanup = undefined;
      }
      syncSignal();
      return;
    }

    fn(innerOnCleanup);
  }, options);
}
