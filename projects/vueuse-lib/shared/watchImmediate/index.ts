import type { WatchHandle } from '@cyia/ngx-vueuse/patch';
import { watch } from '@cyia/ngx-vueuse/patch';

type WatchSource<T = any> = import('@angular/core').Signal<T> | (() => T) | T;

export function watchImmediate<T>(
  source: WatchSource<T>,
  cb: (value: T, oldValue: T | undefined, onCleanup: any) => void,
): WatchHandle;

export function watchImmediate<T extends readonly WatchSource[]>(
  source: T,
  cb: (value: any[], oldValue: any[], onCleanup: any) => void,
): WatchHandle;

export function watchImmediate<T extends object>(
  source: T,
  cb: (value: T, oldValue: T | undefined, onCleanup: any) => void,
): WatchHandle;

/**
 * Shorthand for watching value with {immediate: true}
 *
 * @see https://vueuse.org/watchImmediate
 */
export function watchImmediate<T = any>(source: T, cb: any, options?: any): WatchHandle {
  return watch(source as WatchSource<T>, cb, {
    ...options,
    immediate: true,
  });
}
