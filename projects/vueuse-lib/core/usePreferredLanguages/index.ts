import type { Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';

/**
 * Reactive Navigator Languages.
 *
 * @see https://vueuse.org/usePreferredLanguages
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePreferredLanguages(options: ConfigurableWindow = {}): Signal<readonly string[]> {
  const { window: win = defaultWindow } = options;
  if (!win) return signal(['en']);

  const navigator = win.navigator;
  const value = signal<readonly string[]>(navigator.languages);

  useEventListener(
    win,
    'languagechange',
    () => {
      value.set(navigator.languages);
    },
    { passive: true },
  );

  return value;
}
