import type { Signal } from '@angular/core';
import { computed, effect, signal } from '@angular/core';
import type { ConfigurableDocument, ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { defaultDocument, defaultNavigator } from '../_configurable';
import { useDocumentVisibility } from '../useDocumentVisibility';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

type WakeLockType = 'screen';

export interface WakeLockSentinel extends EventTarget {
  type: WakeLockType;
  released: boolean;
  release: () => Promise<void>;
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock: { request: (type: WakeLockType) => Promise<WakeLockSentinel> };
};

export type UseWakeLockOptions = ConfigurableNavigator & ConfigurableDocument;

export interface UseWakeLockReturn extends Supportable {
  sentinel: Signal<WakeLockSentinel | null>;
  isActive: Signal<boolean>;
  request: (type: WakeLockType) => Promise<void>;
  forceRequest: (type: WakeLockType) => Promise<void>;
  release: () => Promise<void>;
}

/**
 * Reactive Screen Wake Lock API.
 *
 * @see https://vueuse.org/useWakeLock
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useWakeLock(options: UseWakeLockOptions = {}): UseWakeLockReturn {
  const { navigator = defaultNavigator, document: doc = defaultDocument } = options;
  const requestedType = signal<WakeLockType | false>(false);
  const sentinel = signal<WakeLockSentinel | null>(null);
  const documentVisibility = useDocumentVisibility({ document: doc });
  const isSupported = useSupported(() => navigator && 'wakeLock' in navigator);
  const isActive = computed(() => !!sentinel() && documentVisibility() === 'visible');

  if (isSupported()) {
    useEventListener(
      sentinel,
      'release',
      () => {
        requestedType.set(sentinel()?.type ?? false);
      },
      { passive: true },
    );

    // whenever equivalent: watch for visibility change and re-request wake lock
    effect(() => {
      const visibility = documentVisibility();
      const type = requestedType();
      if (visibility === 'visible' && doc?.visibilityState === 'visible' && type) {
        requestedType.set(false);
        forceRequest(type);
      }
    });
  }

  async function forceRequest(type: WakeLockType) {
    await sentinel()?.release();
    sentinel.set(
      isSupported() ? await (navigator as NavigatorWithWakeLock).wakeLock.request(type) : null,
    );
  }

  async function request(type: WakeLockType) {
    if (documentVisibility() === 'visible') await forceRequest(type);
    else requestedType.set(type);
  }

  async function release() {
    requestedType.set(false);
    const s = sentinel();
    sentinel.set(null);
    await s?.release();
  }

  tryOnScopeDispose(() => {
    release();
  });

  return {
    sentinel,
    isSupported,
    isActive,
    request,
    forceRequest,
    release,
  };
}
