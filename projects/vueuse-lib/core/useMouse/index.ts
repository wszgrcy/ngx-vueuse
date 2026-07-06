import type { Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { Position } from '../types';
import type { ConfigurableEventFilter } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';

export type UseMouseCoordType = 'page' | 'client' | 'screen' | 'movement';
export type UseMouseSourceType = 'mouse' | 'touch' | null;
export type UseMouseEventExtractor = (
  event: MouseEvent | Touch,
) => [x: number, y: number] | null | undefined;

interface UseMouseOptionsInternal extends ConfigurableWindow, ConfigurableEventFilter {
  /**
   * Mouse position based by page, client, screen, or relative to previous position
   *
   * @default 'page'
   */
  type?: UseMouseCoordType | UseMouseEventExtractor;

  /**
   * Listen events on `target` element
   *
   * @default 'Window'
   */
  target?:
    | Signal<Window | EventTarget | null | undefined>
    | Window
    | EventTarget
    | null
    | undefined;

  /**
   * Listen to `touchmove` events
   *
   * @default true
   */
  touch?: boolean;

  /**
   * Listen to `scroll` events on window, only effective on type `page`
   *
   * @default true
   */
  scroll?: boolean;

  /**
   * Reset to initial value when `touchend` event fired
   *
   * @default false
   */
  resetOnTouchEnds?: boolean;

  /**
   * Initial values
   */
  initialValue?: Position;
}

export type UseMouseOptions = UseMouseOptionsInternal;

export interface UseMouseReturn {
  x: Signal<number>;
  y: Signal<number>;
  sourceType: Signal<UseMouseSourceType>;
}

const UseMouseBuiltinExtractors: Record<UseMouseCoordType, UseMouseEventExtractor> = {
  page: (event) => [event.pageX, event.pageY],
  client: (event) => [event.clientX, event.clientY],
  screen: (event) => [event.screenX, event.screenY],
  movement: (event) => (event instanceof MouseEvent ? [event.movementX, event.movementY] : null),
} as const;

/**
 * Reactive mouse position.
 *
 * @see https://vueuse.org/useMouse
 * @param options
 */
export function useMouse(options: UseMouseOptions = {}): UseMouseReturn {
  const {
    type = 'page',
    touch = true,
    resetOnTouchEnds = false,
    initialValue = { x: 0, y: 0 },
    window = defaultWindow,
    target = window,
    scroll = true,
    eventFilter,
  } = options;

  let _prevMouseEvent: MouseEvent | null = null;
  let _prevScrollX = 0;
  let _prevScrollY = 0;

  const x = signal(initialValue.x);
  const y = signal(initialValue.y);
  const sourceType = signal<UseMouseSourceType>(null);

  const extractor = typeof type === 'function' ? type : UseMouseBuiltinExtractors[type];

  const mouseHandler = (event: MouseEvent) => {
    const result = extractor(event);
    _prevMouseEvent = event;

    if (result) {
      x.set(result[0]);
      y.set(result[1]);
      sourceType.set('mouse');
    }

    if (window) {
      _prevScrollX = window.scrollX;
      _prevScrollY = window.scrollY;
    }
  };

  const touchHandler = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      const result = extractor(event.touches[0]);
      if (result) {
        x.set(result[0]);
        y.set(result[1]);
        sourceType.set('touch');
      }
    }
  };

  const scrollHandler = () => {
    if (!_prevMouseEvent || !window) return;
    const pos = extractor(_prevMouseEvent);

    if (_prevMouseEvent instanceof MouseEvent && pos) {
      x.set(pos[0] + window.scrollX - _prevScrollX);
      y.set(pos[1] + window.scrollY - _prevScrollY);
    }
  };

  const reset = () => {
    x.set(initialValue.x);
    y.set(initialValue.y);
  };

  const mouseHandlerWrapper = eventFilter
    ? (event: MouseEvent) => eventFilter(() => mouseHandler(event), {} as any)
    : (event: MouseEvent) => mouseHandler(event);

  const touchHandlerWrapper = eventFilter
    ? (event: TouchEvent) => eventFilter(() => touchHandler(event), {} as any)
    : (event: TouchEvent) => touchHandler(event);

  const scrollHandlerWrapper = eventFilter
    ? () => eventFilter(() => scrollHandler(), {} as any)
    : () => scrollHandler();

  if (target) {
    const listenerOptions = { passive: true };
    useEventListener(target, ['mousemove', 'dragover'], mouseHandlerWrapper, listenerOptions);
    if (touch && type !== 'movement') {
      useEventListener(target, ['touchstart', 'touchmove'], touchHandlerWrapper, listenerOptions);
      if (resetOnTouchEnds) useEventListener(target, 'touchend', reset, listenerOptions);
    }
    if (scroll && type === 'page')
      useEventListener(window, 'scroll', scrollHandlerWrapper, listenerOptions);
  }

  return {
    x,
    y,
    sourceType,
  };
}
