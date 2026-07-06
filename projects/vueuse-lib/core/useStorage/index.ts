import type { ConfigurableFlush, RemovableRef } from '@cyia/ngx-vueuse/shared';
import type { Awaitable } from '@cyia/ngx-vueuse/shared';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import type { StorageLike } from '../ssr-handlers';
import type { ConfigurableEventFilter } from '@cyia/ngx-vueuse/shared';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { watchPausable } from '@cyia/ngx-vueuse/shared';
import { computed } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { defaultWindow } from '../_configurable';
import { getSSRHandler } from '../ssr-handlers';
import { useEventListener } from '../useEventListener';
import { guessSerializerType } from './guess';
import { toValue, createRemovableRef } from '@cyia/ngx-vueuse/shared';

export interface Serializer<T> {
  read: (raw: string) => T;
  write: (value: T) => string;
}

export interface SerializerAsync<T> {
  read: (raw: string) => Awaitable<T>;
  write: (value: T) => Awaitable<string>;
}

export const StorageSerializers: Record<
  'boolean' | 'object' | 'number' | 'any' | 'string' | 'map' | 'set' | 'date',
  Serializer<any>
> = {
  boolean: {
    read: (v: any) => v === 'true',
    write: (v: any) => String(v),
  },
  object: {
    read: (v: any) => JSON.parse(v),
    write: (v: any) => JSON.stringify(v),
  },
  number: {
    read: (v: any) => Number.parseFloat(v),
    write: (v: any) => String(v),
  },
  any: {
    read: (v: any) => v,
    write: (v: any) => String(v),
  },
  string: {
    read: (v: any) => v,
    write: (v: any) => String(v),
  },
  map: {
    read: (v: any) => new Map(JSON.parse(v)),
    write: (v: any) => JSON.stringify(Array.from((v as Map<any, any>).entries())),
  },
  set: {
    read: (v: any) => new Set(JSON.parse(v)),
    write: (v: any) => JSON.stringify(Array.from(v as Set<any>)),
  },
  date: {
    read: (v: any) => new Date(v),
    write: (v: any) => v.toISOString(),
  },
};

export const customStorageEventName = 'vueuse-storage';

export interface StorageEventLike {
  storageArea: StorageLike | null;
  key: string | null;
  oldValue: string | null;
  newValue: string | null;
}

export interface UseStorageOptions<T>
  extends ConfigurableEventFilter, ConfigurableWindow, ConfigurableFlush {
  /**
   * Watch for deep changes
   *
   * @default true
   */
  deep?: boolean;

  /**
   * Listen to storage changes, useful for multiple tabs application
   *
   * @default true
   */
  listenToStorageChanges?: boolean;

  /**
   * Write the default value to the storage when it does not exist
   *
   * @default true
   */
  writeDefaults?: boolean;

  /**
   * Merge the default value with the value read from the storage.
   *
   * When setting it to true, it will perform a **shallow merge** for objects.
   * You can pass a function to perform custom merge (e.g. deep merge), for example:
   *
   * @default false
   */
  mergeDefaults?: boolean | ((storageValue: T, defaults: T) => T);

  /**
   * Custom data serialization
   */
  serializer?: Serializer<T>;

  /**
   * On error callback
   *
   * Default log error to `console.error`
   */
  onError?: (error: unknown) => void;

  /**
   * Use shallow signal as reference
   *
   * @default false
   */
  shallow?: boolean;

  /**
   * Wait for the component to be mounted before reading the storage.
   *
   * @default false
   */
  initOnMounted?: boolean;
}

export function useStorage(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<string>,
  storage?: StorageLike,
  options?: UseStorageOptions<string>,
): RemovableRef<string>;
export function useStorage(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<boolean>,
  storage?: StorageLike,
  options?: UseStorageOptions<boolean>,
): RemovableRef<boolean>;
export function useStorage(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<number>,
  storage?: StorageLike,
  options?: UseStorageOptions<number>,
): RemovableRef<number>;
export function useStorage<T>(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<T>,
  storage?: StorageLike,
  options?: UseStorageOptions<T>,
): RemovableRef<T>;
export function useStorage<T = unknown>(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<null>,
  storage?: StorageLike,
  options?: UseStorageOptions<T>,
): RemovableRef<T>;

/**
 * Reactive LocalStorage/SessionStorage.
 *
 * @see https://vueuse.org/useStorage
 */
export function useStorage<T extends string | number | boolean | object | null>(
  key: MaybeRefOrGetter<string>,
  defaults: MaybeRefOrGetter<T>,
  storage: StorageLike | undefined,
  options: UseStorageOptions<T> = {},
): RemovableRef<T> {
  const {
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
    initOnMounted,
  } = options;

  const data = createRemovableRef<T>(typeof defaults === 'function' ? defaults() : defaults);
  const keyComputed = computed<string>(() => toValue(key));

  if (!storage) {
    try {
      storage = getSSRHandler('getDefaultStorage', () => defaultWindow?.localStorage)();
    } catch (e) {
      onError(e);
    }
  }

  if (!storage) return data;

  const rawInit: T = toValue(defaults);
  const type = guessSerializerType<T>(rawInit);
  const serializer = options.serializer ?? StorageSerializers[type];

  const { pause: pauseWatch, resume: resumeWatch } = watchPausable(
    data,
    (newValue) => write(newValue),
    { deep, eventFilter },
  );

  watch(keyComputed, () => update());

  let firstMounted = false;
  const onStorageEvent = (ev: StorageEvent): void => {
    if (initOnMounted && !firstMounted) {
      return;
    }

    update(ev);
  };
  const onStorageCustomEvent = (ev: CustomEvent<StorageEventLike>): void => {
    if (initOnMounted && !firstMounted) {
      return;
    }

    updateFromCustomEvent(ev);
  };

  /**
   * The custom event is needed for same-document syncing when using custom
   * storage backends, but it doesn't work across different documents.
   *
   * TODO: Consider implementing a BroadcastChannel-based solution that fixes this.
   */
  if (window && listenToStorageChanges) {
    if (storage instanceof Storage)
      useEventListener(window, 'storage', onStorageEvent, { passive: true });
    else useEventListener(window, customStorageEventName, onStorageCustomEvent);
  }

  if (initOnMounted) {
    tryOnMounted(() => {
      firstMounted = true;
      update();
    });
  } else {
    update();
  }

  function dispatchWriteEvent(oldValue: string | null, newValue: string | null) {
    // send custom event to communicate within same page
    if (window) {
      const payload = {
        key: keyComputed(),
        oldValue,
        newValue,
        storageArea: storage as Storage,
      };
      // We also use a CustomEvent since StorageEvent cannot
      // be constructed with a non-built-in storage area
      window.dispatchEvent(
        storage instanceof Storage
          ? new StorageEvent('storage', {
              ...payload,
              key: payload.key,
              oldValue: payload.oldValue,
              newValue: payload.newValue,
              storageArea: payload.storageArea,
            })
          : new CustomEvent<StorageEventLike>(customStorageEventName, {
              detail: payload,
            }),
      );
    }
  }

  function write(v: unknown) {
    try {
      const oldValue = storage!.getItem(keyComputed());

      if (v == null) {
        dispatchWriteEvent(oldValue, null);
        storage!.removeItem(keyComputed());
      } else {
        const serialized = serializer.write(v as T);
        if (oldValue !== serialized) {
          storage!.setItem(keyComputed(), serialized);
          dispatchWriteEvent(oldValue, serialized);
        }
      }
    } catch (e) {
      onError(e);
    }
  }

  function read(event?: StorageEventLike) {
    const rawValue = event ? event.newValue : storage!.getItem(keyComputed());

    if (rawValue == null) {
      if (writeDefaults && rawInit != null)
        storage!.setItem(keyComputed(), serializer.write(rawInit));
      return rawInit;
    } else if (!event && mergeDefaults) {
      const value = serializer.read(rawValue);
      if (typeof mergeDefaults === 'function') return mergeDefaults(value, rawInit);
      else if (type === 'object' && !Array.isArray(value))
        return { ...(rawInit as object), ...value };
      return value;
    } else if (typeof rawValue !== 'string') {
      return rawValue;
    } else {
      return serializer.read(rawValue);
    }
  }

  function update(event?: StorageEventLike) {
    if (event && event.storageArea !== storage) return;

    if (event && event.key == null) {
      data.set(rawInit);
      return;
    }

    if (event && event.key !== keyComputed()) {
      return;
    }

    pauseWatch();

    try {
      const serializedData = serializer.write(data() as T);
      if (event === undefined || event?.newValue !== serializedData) {
        data.set(read(event));
      }
    } catch (e) {
      onError(e);
    } finally {
      // use queueMicrotask to avoid infinite loop
      if (event) queueMicrotask(() => resumeWatch());
      else resumeWatch();
    }
  }

  function updateFromCustomEvent(event: CustomEvent<StorageEventLike>) {
    update(event.detail);
  }

  return data;
}
