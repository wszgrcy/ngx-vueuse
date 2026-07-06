import type { Awaitable, Pausable, MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import type { Supportable } from '../types';
import type { MaybeComputedElementRef, MaybeElement } from '../unrefElement';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import {
  computed,
  untracked,
  effect,
  signal,
  DestroyRef,
  inject,
  type Signal,
} from '@angular/core';
import { toValue, toArray } from '@cyia/ngx-vueuse/shared';
import { notNullish } from '@cyia/ngx-vueuse/shared';
import { resolveElement } from '../_resolve-element';
import { useScroll } from '../useScroll';
import { unrefElement } from '../unrefElement';
import { useSupported } from '../useSupported';
import { defaultWindow } from '../_configurable';

type InfiniteScrollElement = HTMLElement | SVGElement | Window | Document | null | undefined;

interface Offset {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface UseInfiniteScrollOptions<T extends InfiniteScrollElement = InfiniteScrollElement> {
  offset?: Offset;
  /**
   * The minimum distance between the bottom of the element and the bottom of the viewport
   *
   * @default 0
   */
  distance?: number;

  /**
   * The direction in which to listen the scroll.
   *
   * @default 'bottom'
   */
  direction?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * The interval time between two load more (to avoid too many invokes).
   *
   * @default 100
   */
  interval?: number;

  /**
   * A function that determines whether more content can be loaded for a specific element.
   * Should return `true` if loading more content is allowed for the given element,
   * and `false` otherwise.
   */
  canLoadMore?: (el: T) => boolean;
}

export interface UseInfiniteScrollReturn {
  isLoading: () => boolean;
  reset: () => void;
}

/**
 * Tracks the visibility of an element within the viewport.
 */
function useElementVisibility(
  element: MaybeComputedElementRef,
  options: {
    window?: Window;
    scrollTarget?: any;
    threshold?: number | number[];
    rootMargin?: string;
  } = {},
): () => boolean {
  const { window = defaultWindow, threshold = 0, rootMargin = '0px' } = options;

  const isVisible = signal(false);
  const isSupported = useSupported(() => window && 'IntersectionObserver' in window);

  if (isSupported()) {
    let observer: IntersectionObserver | undefined;

    const setupObserver = () => {
      if (!window || !isSupported()) return;

      const el = unrefElement(element);
      if (!el) return;

      const win = window as unknown as { IntersectionObserver: typeof IntersectionObserver };
      observer = new win.IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          let isIntersecting = isVisible();
          let latestTime = 0;
          for (const entry of entries) {
            if (entry.time >= latestTime) {
              latestTime = entry.time;
              isIntersecting = entry.isIntersecting;
            }
          }
          untracked(() => {
            isVisible.set(isIntersecting);
          });
        },
        {
          root: unrefElement(options.scrollTarget),
          rootMargin,
          threshold,
        },
      );

      observer?.observe(el);
    };

    setupObserver();

    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => {
      observer?.disconnect();
    });
  }

  return isVisible;
}

/**
 * Detects changes to a target element's visibility.
 */
function useIntersectionObserver(
  target: MaybeComputedElementRef | MaybeRefOrGetter<MaybeElement[]> | MaybeComputedElementRef[],
  callback: IntersectionObserverCallback,
  options: {
    window?: Window;
    immediate?: boolean;
    root?: MaybeComputedElementRef | Document;
    rootMargin?: MaybeRefOrGetter<string>;
    threshold?: number | number[];
  } = {},
): Supportable & Pausable {
  const { root, threshold = 0, window = defaultWindow, immediate = true } = options;

  const isSupported = useSupported(() => window && 'IntersectionObserver' in window);
  const targets = computed(() => {
    const _target = toValue(target);
    return toArray(_target).map(unrefElement).filter(notNullish);
  });

  let cleanup = () => {};
  const isActive = signal(immediate);

  if (isSupported()) {
    effect(() => {
      const _targets = targets();
      const _root = unrefElement(root as MaybeComputedElementRef);
      const _rootMargin = toValue(options.rootMargin as MaybeRefOrGetter<string> | undefined);
      const _isActive = isActive();

      cleanup();
      if (!_isActive) return;

      if (!_targets.length) return;

      const observer = new (window as any).IntersectionObserver(callback, {
        root: _root,
        rootMargin: _rootMargin,
        threshold,
      });

      _targets.forEach((el) => el && observer.observe(el));

      cleanup = () => {
        observer.disconnect();
        cleanup = () => {};
      };
    });
  }

  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => {
    cleanup();
  });

  return {
    get isSupported() {
      return isSupported as Signal<boolean>;
    },
    get isActive() {
      return isActive as unknown as Signal<boolean>;
    },
    pause: () => untracked(() => isActive.set(false)),
    resume: () => untracked(() => isActive.set(true)),
  };
}

/**
 * Reactive infinite scroll.
 *
 * @see https://vueuse.org/useInfiniteScroll
 */
export function useInfiniteScroll<T extends InfiniteScrollElement>(
  element: MaybeRefOrGetter<T>,
  onLoadMore: (state: ReturnType<typeof useScroll>) => Awaitable<void>,
  options: UseInfiniteScrollOptions<T> = {},
): UseInfiniteScrollReturn {
  const { direction = 'bottom', interval = 100, canLoadMore = () => true } = options;

  const state = useScroll(element, {
    ...options,
    offset: {
      [direction]: options.distance ?? 0,
      ...options.offset,
    },
  });

  const promise = signal<Promise<unknown> | null>(null);
  const isLoading = computed(() => !!promise());

  const observedElement = computed<HTMLElement | SVGElement | null | undefined>(() =>
    resolveElement(toValue(element)),
  );

  const isElementVisible = useElementVisibility(observedElement);

  const canLoad = computed(() => {
    if (!observedElement()) return false;
    return canLoadMore(observedElement() as T);
  });

  function checkAndLoad() {
    state.measure();

    if (!observedElement() || !isElementVisible() || !canLoad() || promise()) return;

    const { scrollHeight, clientHeight, scrollWidth, clientWidth } =
      observedElement() as HTMLElement;
    const isNarrower =
      direction === 'bottom' || direction === 'top'
        ? scrollHeight <= clientHeight
        : scrollWidth <= clientWidth;

    if (state.arrivedState[direction] || isNarrower) {
      const newPromise = Promise.all([
        onLoadMore(state),
        new Promise((resolve) => setTimeout(resolve, interval)),
      ]).finally(() => {
        untracked(() => {
          promise.set(null);
        });
        checkAndLoad();
      });
      untracked(() => {
        promise.set(newPromise);
      });
    }
  }

  const stop = effect(() => {
    checkAndLoad();
  });

  tryOnScopeDispose(() => stop.destroy());

  return {
    isLoading,
    reset() {
      checkAndLoad();
    },
  };
}
