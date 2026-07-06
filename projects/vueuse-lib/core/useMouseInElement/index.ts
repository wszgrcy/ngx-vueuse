/**
 * Reactive mouse position related to an element for Angular
 *
 * Ported from VueUse useMouseInElement
 * @see https://vueuse.org/useMouseInElement
 */

import type { Signal } from '@angular/core';
import { signal, DestroyRef, inject, untracked } from '@angular/core';
import type { MaybeElementRef } from '../unrefElement';
import type { UseMouseOptions, UseMouseReturn } from '../useMouse';
import { defaultWindow } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';
import { useMouse } from '../useMouse';
import { useResizeObserver } from '../useResizeObserver';
import { useMutationObserver } from '../useMutationObserver';
import { syncEffect } from '@cyia/ngx-vueuse/patch';

export interface MouseInElementOptions extends UseMouseOptions {
  /**
   * Whether to handle mouse events when the cursor is outside the target element.
   * When enabled, mouse position will continue to be tracked even when outside the element bounds.
   *
   * @default true
   */
  handleOutside?: boolean;

  /**
   * Listen to window resize event
   *
   * @default true
   */
  windowScroll?: boolean;

  /**
   * Listen to window scroll event
   *
   * @default true
   */
  windowResize?: boolean;
}

export interface UseMouseInElementReturn extends UseMouseReturn {
  elementX: Signal<number>;
  elementY: Signal<number>;
  elementPositionX: Signal<number>;
  elementPositionY: Signal<number>;
  elementHeight: Signal<number>;
  elementWidth: Signal<number>;
  isOutside: Signal<boolean>;
  stop: () => void;
}

/**
 * Reactive mouse position related to an element.
 *
 * @see https://vueuse.org/useMouseInElement
 * @param target
 * @param options
 */
export function useMouseInElement(target?: MaybeElementRef, options: MouseInElementOptions = {}) {
  const {
    windowResize = true,
    windowScroll = true,
    handleOutside = true,
    window = defaultWindow,
  } = options;
  const type = options.type || 'page';

  const { x, y, sourceType } = useMouse(options);

  const targetRef = signal(target ?? window?.document?.body);
  const elementX = signal(0);
  const elementY = signal(0);
  const elementPositionX = signal(0);
  const elementPositionY = signal(0);
  const elementHeight = signal(0);
  const elementWidth = signal(0);
  const isOutside = signal(true);

  function update() {
    if (!window) return;

    const el = unrefElement(targetRef());
    if (!el || !(el instanceof Element)) return;

    for (const rect of el.getClientRects()) {
      const { left, top, width, height } = rect;
      untracked(() => {
        elementPositionX.set(left + (type === 'page' ? window.pageXOffset : 0));
        elementPositionY.set(top + (type === 'page' ? window.pageYOffset : 0));
        elementHeight.set(height);
        elementWidth.set(width);
      });

      const elX = x() - elementPositionX();
      const elY = y() - elementPositionY();
      untracked(() => {
        isOutside.set(
          width === 0 || height === 0 || elX < 0 || elY < 0 || elX > width || elY > height,
        );

        if (handleOutside || !isOutside()) {
          elementX.set(elX);
          elementY.set(elY);
        }
      });

      if (!isOutside()) break;
    }
  }

  const stopFns: any[] = [];
  function stop() {
    stopFns.forEach((fn: any) => {
      if (typeof fn === 'function') fn();
    });
    stopFns.length = 0;
  }

  // Initial update
  update();

  const destroyRef = inject(DestroyRef);

  if (window) {
    const stopResizeObserver = useResizeObserver(targetRef as any, update);
    const stopMutationObserver = useMutationObserver(targetRef as any, update, {
      attributeFilter: ['style', 'class'],
    });

    // Watch [targetRef, x, y] like Vue version
    const stopWatch = syncEffect(() => {
      const target = targetRef();
      const xPos = x();
      const yPos = y();
      // Access the signals to trigger dependencies
      void target;
      void xPos;
      void yPos;
      update();
    });

    stopFns.push(stopResizeObserver, stopMutationObserver, stopWatch);

    useEventListener(window.document, 'mouseleave', () => isOutside.set(true), { passive: true });

    if (windowScroll) {
      stopFns.push(useEventListener(window, 'scroll', update, { capture: true, passive: true }));
    }
    if (windowResize) {
      stopFns.push(useEventListener(window, 'resize', update, { passive: true }));
    }
  }

  destroyRef.onDestroy(() => {
    stop();
  });

  return {
    x,
    y,
    sourceType,
    elementX,
    elementY,
    elementPositionX,
    elementPositionY,
    elementHeight,
    elementWidth,
    isOutside,
    stop,
  };
}
