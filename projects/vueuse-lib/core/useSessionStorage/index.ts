import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { UseStorageOptions } from '../useStorage';
import type { StorageLike } from '../ssr-handlers';
import { defaultWindow } from '../_configurable';
import { useStorage } from '../useStorage';

export interface UseSessionStorageOptions<T> extends UseStorageOptions<T> {
  storage?: StorageLike;
}

export function useSessionStorage(
  key: SignalOrValue<string> | (() => string),
  initialValue: SignalOrValue<string> | (() => string),
  options?: UseSessionStorageOptions<string>,
): ReturnType<typeof useStorage>;
export function useSessionStorage(
  key: SignalOrValue<string> | (() => string),
  initialValue: SignalOrValue<boolean> | (() => boolean),
  options?: UseSessionStorageOptions<boolean>,
): ReturnType<typeof useStorage>;
export function useSessionStorage(
  key: SignalOrValue<string> | (() => string),
  initialValue: SignalOrValue<number> | (() => number),
  options?: UseSessionStorageOptions<number>,
): ReturnType<typeof useStorage>;
export function useSessionStorage<T>(
  key: SignalOrValue<string> | (() => string),
  initialValue: SignalOrValue<T> | (() => T),
  options?: UseSessionStorageOptions<T>,
): ReturnType<typeof useStorage>;
export function useSessionStorage<T = unknown>(
  key: SignalOrValue<string> | (() => string),
  initialValue: SignalOrValue<null> | (() => null),
  options?: UseSessionStorageOptions<T>,
): ReturnType<typeof useStorage>;

/**
 * Reactive SessionStorage.
 *
 * @see https://vueuse.org/useSessionStorage
 * @param key
 * @param initialValue
 * @param options
 */
export function useSessionStorage<T extends string | number | boolean | object | null>(
  key: SignalOrValue<string> | (() => string),
  initialValue: SignalOrValue<T> | (() => T),
  options: UseSessionStorageOptions<T> = {},
): ReturnType<typeof useStorage> {
  const { window = defaultWindow, storage } = options;
  return useStorage(key, initialValue, storage ?? window?.sessionStorage, options);
}
