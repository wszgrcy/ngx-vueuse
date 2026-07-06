import { watch } from '@cyia/ngx-vueuse/patch';
import type { WatchHandle } from '@cyia/ngx-vueuse/patch';
import type { Signal, WritableSignal } from '@angular/core';

export interface SyncRefsOptions {
  /**
   * Watch deeply
   *
   * @default false
   */
  deep?: boolean;
  /**
   * Sync values immediately
   *
   * @default true
   */
  immediate?: boolean;
}

/**
 * Note: Angular `effect()` does not have a `flush` option like Vue's `watch`.
 * VueUse's original `syncRefs` supported `flush: 'sync' | 'pre' | 'post'` via `watchPausable`.
 * In Angular, effects execute synchronously during the change detection cycle,
 * which is equivalent to `flush: 'sync'`. If you need precise timing control,
 * consider using `afterNextRender()` or manual computed() + effect() composition.
 */

/**
 * Keep target signals in sync with the source signal.
 *
 * @param source source signal
 * @param targets target signals
 */
export function syncRefs<T>(
  source: Signal<T>,
  targets: WritableSignal<T> | WritableSignal<T>[],
  options: SyncRefsOptions = {},
): WatchHandle {
  const { deep = false, immediate = true } = options;

  const targetsArray = Array.isArray(targets) ? targets : [targets];

  let effectRef: WatchHandle;
  try {
    effectRef = watch(source, (v) => targetsArray.forEach((target) => target.set(v)), {
      immediate,
    });
  } catch {
    // Not in injection context - just set once
    const newValue = source();
    targetsArray.forEach((target) => target.set(newValue));
    effectRef = (() => {}) as any;
  }

  return effectRef;
}
