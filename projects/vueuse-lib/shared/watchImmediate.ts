import { watch } from '../patch/watch';
import type { WatchHandle } from '../patch/watch';

/**
 * Watch a signal/source with immediate execution.
 * Analogous to Vue's `watch(source, cb, { immediate: true })`.
 */
export function watchImmediate<T>(...args: Parameters<typeof watch>): WatchHandle {
  return watch(args[0], args[1], { ...args[2], immediate: true });
}
