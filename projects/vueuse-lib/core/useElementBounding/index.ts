import { signal, type Signal } from '@angular/core';
import type { MaybeComputedElementRef } from '../unrefElement';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';
import { useMutationObserver } from '../useMutationObserver';
import { useResizeObserver } from '../useResizeObserver';
import { syncEffect } from '@cyia/ngx-vueuse/patch';

export interface UseElementBoundingOptions {
  /**
   * Reset values to 0 on component unmounted
   *
   * @default true
   */
  reset?: boolean;

  /**
   * Listen to window resize event
   *
   * @default true
   */
  windowResize?: boolean;
  /**
   * Listen to window scroll event
   *
   * @default true
   */
  windowScroll?: boolean;

  /**
   * Immediately call update on component mounted
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Timing to recalculate the bounding box
   *
   * Setting to `next-frame` can be useful when using this together with something like {@link useBreakpoints}
   * and therefore the layout (which influences the bounding box of the observed element) is not updated on the current tick.
   *
   * @default 'sync'
   */
  updateTiming?: 'sync' | 'next-frame';
}

export interface UseElementBoundingReturn {
  height: Signal<number>;
  bottom: Signal<number>;
  left: Signal<number>;
  right: Signal<number>;
  top: Signal<number>;
  width: Signal<number>;
  x: Signal<number>;
  y: Signal<number>;
  update: () => void;
}

/**
 * Reactive bounding box of an HTML element.
 *
 * @see https://vueuse.org/useElementBounding
 * @param target
 */
export function useElementBounding(
  target: MaybeComputedElementRef,
  options: UseElementBoundingOptions = {},
): UseElementBoundingReturn {
  const {
    reset = true,
    windowResize = true,
    windowScroll = true,
    immediate = true,
    updateTiming = 'sync',
  } = options;

  const height = signal(0);
  const bottom = signal(0);
  const left = signal(0);
  const right = signal(0);
  const top = signal(0);
  const width = signal(0);
  const x = signal(0);
  const y = signal(0);

  function recalculate() {
    const el = unrefElement(target);

    if (!el) {
      if (reset) {
        height.set(0);
        bottom.set(0);
        left.set(0);
        right.set(0);
        top.set(0);
        width.set(0);
        x.set(0);
        y.set(0);
      }
      return;
    }

    const rect = el.getBoundingClientRect();

    height.set(rect.height);
    bottom.set(rect.bottom);
    left.set(rect.left);
    right.set(rect.right);
    top.set(rect.top);
    width.set(rect.width);
    x.set(rect.x);
    y.set(rect.y);
  }

  function update() {
    if (updateTiming === 'sync') recalculate();
    else if (updateTiming === 'next-frame') requestAnimationFrame(() => recalculate());
  }

  useResizeObserver(target, update);

  // Watch for element removal to trigger update
  // In Vue: watch(() => unrefElement(target), ele => !ele && update())
  // In Angular, we use syncEffect to mimic this behavior
  syncEffect(() => {
    const el = unrefElement(target);
    if (!el) update();
  });

  // trigger by css or style
  useMutationObserver(target, update, {
    attributeFilter: ['style', 'class'],
  });

  if (windowScroll) useEventListener('scroll', update, { capture: true, passive: true });
  if (windowResize) useEventListener('resize', update, { passive: true });

  tryOnMounted(() => {
    if (immediate) update();
  });

  return {
    height,
    bottom,
    left,
    right,
    top,
    width,
    x,
    y,
    update,
  };
}
