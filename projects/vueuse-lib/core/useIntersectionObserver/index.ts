import type { Pausable } from '@cyia/ngx-vueuse/shared';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import type { MaybeComputedElementRef, MaybeElement } from '../unrefElement';
import { noop, notNullish, toArray, tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { computed, signal, effect } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useSupported } from '../useSupported';

export interface UseIntersectionObserverOptions extends ConfigurableWindow {
  /**
   * Start the IntersectionObserver immediately on creation
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * The Element or Document whose bounds are used as the bounding box when testing for intersection.
   */
  root?: MaybeComputedElementRef | Document;

  /**
   * A string which specifies a set of offsets to add to the root's bounding_box when calculating intersections.
   */
  rootMargin?: MaybeRefOrGetter<string>;

  /**
   * Either a single number or an array of numbers between 0.0 and 1.
   * @default 0
   */
  threshold?: number | number[];
}

export interface UseIntersectionObserverReturn extends Supportable, Pausable {
  stop: () => void;
}

/**
 * Detects changes to a target element's visibility.
 *
 * @see https://vueuse.org/useIntersectionObserver
 * @param target
 * @param callback
 * @param options
 */
export function useIntersectionObserver(
  target: MaybeComputedElementRef | MaybeRefOrGetter<MaybeElement[]> | MaybeComputedElementRef[],
  callback: IntersectionObserverCallback,
  options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverReturn {
  const { root, rootMargin, threshold = 0, window = defaultWindow, immediate = true } = options;

  const isSupported = useSupported(() => window && 'IntersectionObserver' in window);
  const targets = computed(() => {
    const _target = toValue(target);
    return toArray(_target).map(unrefElement).filter(notNullish);
  });

  let cleanup = noop;
  const isActive = signal(immediate);

  const stopWatch = isSupported()
    ? effect(() => {
        cleanup();
        if (!isActive()) return;

        if (!targets().length) return;

        const observer = new IntersectionObserver(callback, {
          root: unrefElement(toValue(root as MaybeComputedElementRef)),
          rootMargin: toValue(rootMargin),
          threshold,
        });

        targets().forEach((el) => el && observer.observe(el));

        cleanup = () => {
          observer.disconnect();
          cleanup = noop;
        };
      })
    : noop;

  const stop = () => {
    cleanup();
    stopWatch && typeof stopWatch === 'object' ? stopWatch.destroy() : stopWatch();
    isActive.set(false);
  };

  tryOnScopeDispose(stop);

  return {
    isSupported,
    isActive,
    pause() {
      cleanup();
      isActive.set(false);
    },
    resume() {
      isActive.set(true);
    },
    stop,
  };
}
