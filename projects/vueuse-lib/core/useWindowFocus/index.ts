import type { ConfigurableWindow } from '../_configurable';
import { signal, type Signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';

/**
 * Reactively track window focus with `window.onfocus` and `window.onblur`.
 *
 * @see https://vueuse.org/useWindowFocus
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useWindowFocus(options: ConfigurableWindow = {}): Signal<boolean> {
  const { window = defaultWindow } = options;
  if (!window) return signal(false);

  const focused = signal(window.document.hasFocus());

  const listenerOptions = { passive: true };

  useEventListener(
    window,
    'blur',
    () => {
      focused.set(false);
    },
    listenerOptions,
  );

  useEventListener(
    window,
    'focus',
    () => {
      focused.set(true);
    },
    listenerOptions,
  );

  return focused;
}
