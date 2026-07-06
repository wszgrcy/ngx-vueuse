import { signal, type Signal } from '@angular/core';
import { syncEffect } from '@cyia/ngx-vueuse/patch';
import type { ConfigurableWindow } from '../_configurable';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useMediaQuery } from '../useMediaQuery';

export interface UseWindowSizeOptions extends ConfigurableWindow {
  initialWidth?: number;
  initialHeight?: number;
  /**
   * Listen to window `orientationchange` event
   *
   * @default true
   */
  listenOrientation?: boolean;

  /**
   * Whether the scrollbar should be included in the width and height
   * Only effective when `type` is `'inner'`
   *
   * @default true
   */
  includeScrollbar?: boolean;

  /**
   * Use `window.innerWidth` or `window.outerWidth` or `window.visualViewport`
   * visualViewport documentation from MDN(https://developer.mozilla.org/zh-CN/docs/Web/API/VisualViewport)
   * @default 'inner'
   */
  type?: 'inner' | 'outer' | 'visual';
}

export interface UseWindowSizeReturn {
  width: Signal<number>;
  height: Signal<number>;
}

/**
 * Reactive window size.
 *
 * @see https://vueuse.org/useWindowSize
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useWindowSize(options: UseWindowSizeOptions = {}): UseWindowSizeReturn {
  const {
    window: win = defaultWindow,
    initialWidth = Number.POSITIVE_INFINITY,
    initialHeight = Number.POSITIVE_INFINITY,
    listenOrientation = true,
    includeScrollbar = true,
    type = 'inner',
  } = options;

  const width = signal(initialWidth);
  const height = signal(initialHeight);

  const update = () => {
    if (win) {
      if (type === 'outer') {
        width.set(win.outerWidth);
        height.set(win.outerHeight);
      } else if (type === 'visual' && win.visualViewport) {
        const {
          width: visualViewportWidth,
          height: visualViewportHeight,
          scale,
        } = win.visualViewport;
        width.set(Math.round(visualViewportWidth * scale));
        height.set(Math.round(visualViewportHeight * scale));
      } else if (includeScrollbar) {
        width.set(win.innerWidth);
        height.set(win.innerHeight);
      } else {
        width.set(win.document.documentElement.clientWidth);
        height.set(win.document.documentElement.clientHeight);
      }
    }
  };

  update();

  const listenerOptions = { passive: true };
  useEventListener('resize', update, listenerOptions);

  if (win && type === 'visual' && win.visualViewport) {
    useEventListener(win.visualViewport, 'resize', update, listenerOptions);
  }

  if (listenOrientation) {
    const matches = useMediaQuery('(orientation: portrait)');
    syncEffect(() => {
      matches();
      update();
    });
  }

  return { width, height };
}
