import type { Signal } from '@angular/core';
import { computed, signal, afterNextRender, DestroyRef, inject } from '@angular/core';
import type { Fn } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { unrefElement, type MaybeElement, type MaybeComputedElementRef } from '../unrefElement';
import { useEventListener } from '../useEventListener';
import { useMutationObserver } from '../useMutationObserver';
import { useThrottleFn } from '@cyia/ngx-vueuse/shared';
import { useDebounceFn } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';

/**
 * Writable computed-like signal for useScroll x/y.
 * Provides both get () => T and set (value: T) => void interface.
 * Can be called as function(): T or function(value: T): T
 */
interface WritableComputed<T> {
  (): T;
  (value: T): T;
  value: T;
}

export interface UseScrollOptions extends ConfigurableWindow {
  /**
   * Throttle time for scroll event, it's disabled by default.
   *
   * @default 0
   */
  throttle?: number;

  /**
   * The check time when scrolling ends.
   * This configuration will be setting to (throttle + idle) when the `throttle` is configured.
   *
   * @default 200
   */
  idle?: number;

  /**
   * Offset arrived states by x pixels
   */
  offset?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };

  /**
   * Use MutationObserver to monitor specific DOM changes,
   * such as attribute modifications, child node additions or removals, or subtree changes.
   * @default { mutation: false }
   */
  observe?:
    | boolean
    | {
        mutation?: boolean;
      };

  /**
   * Trigger it when scrolling.
   */
  onScroll?: (e: Event) => void;

  /**
   * Trigger it when scrolling ends.
   */
  onStop?: (e: Event) => void;

  /**
   * Listener options for scroll event.
   *
   * @default {capture: false, passive: true}
   */
  eventListenerOptions?: boolean | AddEventListenerOptions;

  /**
   * Optionally specify a scroll behavior of `auto` (default, not smooth scrolling) or
   * `smooth` (for smooth scrolling) which takes effect when changing the `x` or `y` refs.
   *
   * @default 'auto'
   */
  behavior?: MaybeRefOrGetter<ScrollBehavior>;

  /**
   * On error callback
   *
   * Default log error to `console.error`
   */
  onError?: (error: unknown) => void;
}

export interface UseScrollReturn {
  x: WritableComputed<number>;
  y: WritableComputed<number>;
  isScrolling: Signal<boolean>;
  arrivedState: {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
  };
  directions: {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
  };
  measure: () => void;
}

/**
 * We have to check if the scroll amount is close enough to some threshold in order to
 * more accurately calculate arrivedState. This is because scrollTop/scrollLeft are non-rounded
 * numbers, while scrollHeight/scrollWidth and clientHeight/clientWidth are rounded.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
 */
const ARRIVED_STATE_THRESHOLD_PIXELS = 1;

/**
 * Reactive scroll.
 *
 * @see https://vueuse.org/useScroll
 * @param element
 * @param options
 */
export function useScroll(
  element: MaybeRefOrGetter<HTMLElement | SVGElement | Window | Document | null | undefined>,
  options: UseScrollOptions = {},
): UseScrollReturn {
  const destroyRef = inject(DestroyRef);

  const {
    throttle = 0,
    idle = 200,
    onStop = () => {},
    onScroll = () => {},
    offset = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
    observe: _observe = {
      mutation: false,
    },
    eventListenerOptions = {
      capture: false,
      passive: true,
    },
    behavior = 'auto',
    window = defaultWindow,
    onError = (e) => {
      console.error(e);
    },
  } = options;

  const observe =
    typeof _observe === 'boolean'
      ? {
          mutation: _observe,
        }
      : _observe;

  const internalX = signal(0);
  const internalY = signal(0);

  function scrollTo(_x: number | undefined, _y: number | undefined) {
    if (!window) return;

    const _element = toValue(element);
    if (!_element) return;
    (_element instanceof Document ? window.document.body : _element)?.scrollTo({
      top: toValue(_y) ?? internalY(),
      left: toValue(_x) ?? internalX(),
      behavior: toValue(behavior),
    });
    const scrollContainer =
      (_element as Window)?.document?.documentElement ||
      (_element as Document)?.documentElement ||
      (_element as Element);
    if (_x != null) internalX.set(scrollContainer.scrollLeft);
    if (_y != null) internalY.set(scrollContainer.scrollTop);
  }

  // Use a computed for x and y because we try to write the value to the refs
  // during a `scrollTo()` without firing additional `scrollTo()`s in the process.
  // Create writable computed-like signals using a helper pattern.
  const x = createWritableComputed(internalX, (val: number) => {
    try {
      scrollTo(val, undefined);
    } catch (e) {
      onError(e);
    }
  });

  const y = createWritableComputed(internalY, (val: number) => {
    try {
      scrollTo(undefined, val);
    } catch (e) {
      onError(e);
    }
  });

  function createWritableComputed(
    source: Signal<number>,
    setter: (val: number) => void,
  ): WritableComputed<number> {
    const computedSignal = computed(() => source());
    const result = ((val?: number) => {
      if (val === undefined) return computedSignal();
      setter(val);
      return computedSignal();
    }) as WritableComputed<number>;
    result.value = computedSignal();
    return result;
  }

  const isScrolling = signal(false);
  const arrivedState = {
    left: true,
    right: false,
    top: true,
    bottom: false,
  };
  const directions = {
    left: false,
    right: false,
    top: false,
    bottom: false,
  };

  const onScrollEnd = (e: Event) => {
    // dedupe if support native scrollend event
    if (!isScrolling()) return;

    isScrolling.set(false);
    directions.left = false;
    directions.right = false;
    directions.top = false;
    directions.bottom = false;
    onStop(e);
  };

  const onScrollEndDebounced = useDebounceFn(onScrollEnd, throttle + idle) as unknown as (
    e: Event,
  ) => void;

  const setArrivedState = (
    target: HTMLElement | SVGElement | Window | Document | null | undefined,
  ) => {
    if (!window) return;

    const el: Element = ((target as Window)?.document?.documentElement ||
      (target as Document)?.documentElement ||
      unrefElement(target as MaybeComputedElementRef<MaybeElement>)) as Element;

    const { display, flexDirection, direction } = window.getComputedStyle(el);
    const directionMultipler = direction === 'rtl' ? -1 : 1;

    const scrollLeft = el.scrollLeft;
    directions.left = scrollLeft < internalX();
    directions.right = scrollLeft > internalX();

    const left = Math.abs(scrollLeft * directionMultipler) <= (offset.left || 0);
    const right =
      Math.abs(scrollLeft * directionMultipler) + el.clientWidth >=
      el.scrollWidth - (offset.right || 0) - ARRIVED_STATE_THRESHOLD_PIXELS;

    if (display === 'flex' && flexDirection === 'row-reverse') {
      arrivedState.left = right;
      arrivedState.right = left;
    } else {
      arrivedState.left = left;
      arrivedState.right = right;
    }

    internalX.set(scrollLeft);

    let scrollTop = el.scrollTop;

    // patch for mobile compatible
    if (target === window.document && !scrollTop) scrollTop = window.document.body.scrollTop;

    directions.top = scrollTop < internalY();
    directions.bottom = scrollTop > internalY();
    const top = Math.abs(scrollTop) <= (offset.top || 0);
    const bottom =
      Math.abs(scrollTop) + el.clientHeight >=
      el.scrollHeight - (offset.bottom || 0) - ARRIVED_STATE_THRESHOLD_PIXELS;

    /**
     * reverse columns and rows behave exactly the other way around,
     * bottom is treated as top and top is treated as the negative version of bottom
     */
    if (display === 'flex' && flexDirection === 'column-reverse') {
      arrivedState.top = bottom;
      arrivedState.bottom = top;
    } else {
      arrivedState.top = top;
      arrivedState.bottom = bottom;
    }

    internalY.set(scrollTop);
  };

  const onScrollHandler = (e: Event) => {
    if (!window) return;

    const eventTarget = ((e.target as Document).documentElement ?? e.target) as HTMLElement;

    setArrivedState(eventTarget);

    isScrolling.set(true);
    onScrollEndDebounced(e);
    onScroll(e);
  };

  useEventListener(
    element,
    'scroll',
    throttle
      ? (useThrottleFn(onScrollHandler, throttle, true, false) as unknown as Fn)
      : onScrollHandler,
    eventListenerOptions,
  );

  afterNextRender(() => {
    try {
      const _element = toValue(element);
      if (!_element) return;
      setArrivedState(_element);
    } catch (e) {
      onError(e);
    }
  });

  if (observe?.mutation && element != null && element !== window && element !== document) {
    useMutationObserver(
      element as MaybeRefOrGetter<HTMLElement | SVGElement>,
      () => {
        const _element = toValue(element);
        if (!_element) return;
        setArrivedState(_element);
      },
      {
        attributes: true,
        childList: true,
        subtree: true,
      },
    );
  }

  useEventListener(element, 'scrollend', onScrollEnd, eventListenerOptions);

  return {
    x,
    y,
    isScrolling,
    arrivedState,
    directions,
    measure() {
      const _element = toValue(element);

      if (window && _element) setArrivedState(_element);
    },
  };
}
