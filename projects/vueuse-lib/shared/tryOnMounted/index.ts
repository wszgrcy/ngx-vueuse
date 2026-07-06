import type { Fn } from '../utils/types';
import { afterNextRender, inject, EnvironmentInjector } from '@angular/core';
import { runInInjectionContext } from '@angular/core';

/**
 * Call afterNextRender() if it's inside a component lifecycle, if not, just call the function
 *
 * @param fn
 * @param sync if set to false, it will run in the nextTick() of Angular
 * @param target
 */
export function tryOnMounted(fn: Fn, sync = true, target?: EnvironmentInjector | null) {
  const injector = target || inject(EnvironmentInjector, { optional: true });
  if (injector) {
    afterNextRender(
      () => {
        runInInjectionContext(injector, fn);
      },
      { injector },
    );
  } else if (sync) {
    fn();
  } else {
    queueMicrotask(() => fn());
  }
}
