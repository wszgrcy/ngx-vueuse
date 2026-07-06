import type { SignalOrGetter } from '../utils/types';
import { watch, type WatchHandle } from '@cyia/ngx-vueuse/patch';

export function watchOnce<T>(
  source: SignalOrGetter<T>,
  cb: (value: T, oldValue?: T | undefined) => void,
  options?: { immediate?: boolean; deep?: boolean },
): WatchHandle;

export function watchOnce<T extends Readonly<SignalOrGetter<any>>[]>(
  source: [...T],
  cb: (...args: any[]) => void,
  options?: { immediate?: boolean; deep?: boolean },
): WatchHandle;

export function watchOnce<T extends object>(
  source: T,
  cb: (value: T, oldValue?: T | undefined) => void,
  options?: { immediate?: boolean; deep?: boolean },
): WatchHandle;

/**
 * Shorthand for watching value with { once: true }
 *
 * @see https://vueuse.org/watchOnce
 */
export function watchOnce<T = any>(
  source: SignalOrGetter<T>,
  cb: any,
  options?: { immediate?: boolean; deep?: boolean },
) {
  return watch(source as any, cb as any, { ...options, once: true } as any);
}
