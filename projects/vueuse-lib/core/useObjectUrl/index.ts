import type { Signal } from '@angular/core';
import { DestroyRef, effect, inject, isSignal, signal } from '@angular/core';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';

type MaybeSignalOrValue<T> = Signal<T> | T;

/**
 * Reactive URL representing an object.
 *
 * @see https://vueuse.org/useObjectUrl
 * @param object
 */
export function useObjectUrl(
  object: MaybeSignalOrValue<Blob | MediaSource | null | undefined>,
): Signal<string | undefined> {
  const url = signal<string | undefined>(undefined);

  const release = () => {
    const currentUrl = url();
    if (currentUrl) URL.revokeObjectURL(currentUrl);

    url.set(undefined);
  };

  // Watch: react to object changes (equivalent to Vue's watch with immediate: true)
  effect(() => {
    const obj = isSignal(object) ? object() : object;
    release();

    if (obj) {
      url.set(URL.createObjectURL(obj));
    }
  });

  const destroyRef = inject(DestroyRef);
  tryOnScopeDispose(release);

  return url;
}
