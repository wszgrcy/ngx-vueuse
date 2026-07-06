import type { RemovableRef } from '@cyia/ngx-vueuse/shared';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import type { StorageLikeAsync } from '../ssr-handlers';
import type { SerializerAsync, UseStorageOptions } from '../useStorage';
import type { ConfigurableEventFilter } from '@cyia/ngx-vueuse/shared';
import { watchWithFilter } from '@cyia/ngx-vueuse/shared';
import { toValue, createRemovableRef } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { getSSRHandler } from '../ssr-handlers';
import { useEventListener } from '../useEventListener';
import { StorageSerializers } from '../useStorage';
import { guessSerializerType } from '../useStorage/guess';

export interface UseStorageAsyncOptions<T>
  extends Omit<UseStorageOptions<T>, 'serializer'>, ConfigurableEventFilter {
  /**
   * Custom data serialization
   */
  serializer?: SerializerAsync<T>;

  /**
   * On first value loaded hook.
   */
  onReady?: (value: T) => void;
}

export function useStorageAsync(
  key: string,
  initialValue: MaybeRefOrGetter<string>,
  storage?: StorageLikeAsync,
  options?: UseStorageAsyncOptions<string>,
): RemovableRef<string> & Promise<RemovableRef<string>>;
export function useStorageAsync(
  key: string,
  initialValue: MaybeRefOrGetter<boolean>,
  storage?: StorageLikeAsync,
  options?: UseStorageAsyncOptions<boolean>,
): RemovableRef<boolean> & Promise<RemovableRef<boolean>>;
export function useStorageAsync(
  key: string,
  initialValue: MaybeRefOrGetter<number>,
  storage?: StorageLikeAsync,
  options?: UseStorageAsyncOptions<number>,
): RemovableRef<number> & Promise<RemovableRef<number>>;
export function useStorageAsync<T>(
  key: string,
  initialValue: MaybeRefOrGetter<T>,
  storage?: StorageLikeAsync,
  options?: UseStorageAsyncOptions<T>,
): RemovableRef<T> & Promise<RemovableRef<T>>;
export function useStorageAsync<T = unknown>(
  key: string,
  initialValue: MaybeRefOrGetter<null>,
  storage?: StorageLikeAsync,
  options?: UseStorageAsyncOptions<T>,
): RemovableRef<T> & Promise<RemovableRef<T>>;

/**
 * Reactive Storage with async support.
 *
 * @see https://vueuse.org/useStorageAsync
 * @param key
 * @param initialValue
 * @param storage
 * @param options
 */
export function useStorageAsync<T extends string | number | boolean | object | null>(
  key: string,
  initialValue: MaybeRefOrGetter<T>,
  storage: StorageLikeAsync | undefined,
  options: UseStorageAsyncOptions<T> = {},
): RemovableRef<T> & Promise<RemovableRef<T>> {
  const {
    flush = 'pre',
    deep = true,
    listenToStorageChanges = true,
    writeDefaults = true,
    mergeDefaults = false,
    shallow,
    window = defaultWindow,
    eventFilter,
    onError = (e) => {
      console.error(e);
    },
    onReady,
  } = options;

  const rawInit: T = toValue(initialValue);
  const type = guessSerializerType<T>(rawInit);

  const data = createRemovableRef<T>(toValue(initialValue));
  const serializer = options.serializer ?? StorageSerializers[type];

  if (!storage) {
    try {
      storage = getSSRHandler('getDefaultStorageAsync', () => defaultWindow?.localStorage)();
    } catch (e) {
      onError(e);
    }
  }

  async function read(event?: StorageEvent) {
    if (!storage || (event && event.key !== key)) return;

    try {
      const rawValue = event ? event.newValue : await storage.getItem(key);
      if (rawValue == null) {
        data.set(rawInit);
        if (writeDefaults && rawInit !== null)
          await storage.setItem(key, await serializer.write(rawInit));
      } else if (mergeDefaults) {
        const value = await serializer.read(rawValue);
        if (typeof mergeDefaults === 'function') data.set(mergeDefaults(value, rawInit));
        else if (type === 'object' && !Array.isArray(value))
          data.set({ ...(rawInit as object), ...value });
        else data.set(value);
      } else {
        data.set(await serializer.read(rawValue));
      }
    } catch (e) {
      onError(e);
    }
  }

  const promise = new Promise((resolve) => {
    read().then(() => {
      onReady?.(data() as T);
      resolve(data);
    });
  });

  if (window && listenToStorageChanges)
    useEventListener(window, 'storage', (e) => Promise.resolve().then(() => read(e)), {
      passive: true,
    });

  if (storage) {
    watchWithFilter(
      data,
      async () => {
        try {
          if (data() == null) await storage!.removeItem(key);
          else await storage!.setItem(key, await serializer.write(data()));
        } catch (e) {
          onError(e);
        }
      },
      {
        deep,
        eventFilter,
      },
    );
  }

  Object.assign(data, {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  });

  return data as RemovableRef<T> & Promise<RemovableRef<T>>;
}
