import type { RemovableRef } from '@cyia/ngx-vueuse/shared';
import type { UseStorageOptions } from '../useStorage';
import { defaultWindow } from '../_configurable';
import { useStorage } from '../useStorage';

export function useLocalStorage(
  key: string | (() => string),
  initialValue: string | (() => string),
  options?: UseStorageOptions<string>,
): RemovableRef<string>;
export function useLocalStorage(
  key: string | (() => string),
  initialValue: boolean | (() => boolean),
  options?: UseStorageOptions<boolean>,
): RemovableRef<boolean>;
export function useLocalStorage(
  key: string | (() => string),
  initialValue: number | (() => number),
  options?: UseStorageOptions<number>,
): RemovableRef<number>;
export function useLocalStorage<T>(
  key: string | (() => string),
  initialValue: T | (() => T),
  options?: UseStorageOptions<T>,
): RemovableRef<T>;
export function useLocalStorage<T = unknown>(
  key: string | (() => string),
  initialValue: null | (() => null),
  options?: UseStorageOptions<T>,
): RemovableRef<T>;

/**
 * Reactive LocalStorage.
 *
 * @see https://vueuse.org/useLocalStorage
 * @param key
 * @param initialValue
 * @param options
 */
export function useLocalStorage<T extends string | number | boolean | object | null>(
  key: string | (() => string),
  initialValue: T | (() => T),
  options: UseStorageOptions<T> = {},
): RemovableRef<any> {
  const { window = defaultWindow } = options;
  return useStorage(key, initialValue, window?.localStorage, options);
}
