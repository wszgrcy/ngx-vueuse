import { computed } from '@angular/core';
import { syncEffect } from '@cyia/ngx-vueuse/patch';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import type { MaybeComputedElementRef, MaybeElement } from '../unrefElement';
import { notNullish } from '@cyia/ngx-vueuse/shared';
import { toArray } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useSupported } from '../useSupported';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';

type MaybeRefOrGetter<T> = T | (() => T);

export interface UseMutationObserverOptions extends MutationObserverInit, ConfigurableWindow {}

export interface UseMutationObserverReturn extends Supportable {
  stop: () => void;
  takeRecords: () => MutationRecord[] | undefined;
}

/**
 * Watch for changes being made to the DOM tree.
 *
 * @see https://vueuse.org/useMutationObserver
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver MutationObserver MDN
 * @param target
 * @param callback
 * @param options
 */
export function useMutationObserver(
  target: MaybeComputedElementRef | MaybeComputedElementRef[] | MaybeRefOrGetter<MaybeElement[]>,
  callback: MutationCallback,
  options: UseMutationObserverOptions = {},
): UseMutationObserverReturn {
  const { window = defaultWindow, ...mutationOptions } = options;
  let observer: MutationObserver | undefined;
  const isSupported = useSupported(() => window && 'MutationObserver' in window);

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = undefined;
    }
  };

  const targets = computed(() => {
    const value = toValue(target);
    const items = toArray(value).map(unrefElement).filter(notNullish);
    return new Set(items);
  });

  const stopWatch = syncEffect(() => {
    const newTargets = targets();
    cleanup();

    if (isSupported() && newTargets.size) {
      observer = new MutationObserver(callback);
      newTargets.forEach((el) => observer!.observe(el, mutationOptions));
    }
  });

  const takeRecords = () => observer?.takeRecords();

  const stop = () => {
    stopWatch.destroy();
    cleanup();
  };

  tryOnScopeDispose(stop);

  return {
    isSupported,
    stop,
    takeRecords,
  };
}
