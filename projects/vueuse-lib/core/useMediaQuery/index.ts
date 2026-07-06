import { computed, signal, untracked, type Signal } from '@angular/core';
import { syncEffect } from '@cyia/ngx-vueuse/patch';
import { pxValue } from '@cyia/ngx-vueuse/shared';

type MaybeRefOrGetter<T> = Signal<T> | T | (() => T);
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSSRWidth } from '../useSSRWidth';
import { useSupported } from '../useSupported';

export interface UseMediaQueryOptions {
  window?: Window;
  ssrWidth?: number;
}

/**
 * Reactive Media Query.
 *
 * @see https://vueuse.org/useMediaQuery
 * @param query
 * @param options
 */
export function useMediaQuery(
  query: MaybeRefOrGetter<string>,
  options: UseMediaQueryOptions = {},
): Signal<boolean> {
  const { window: win = defaultWindow, ssrWidth = useSSRWidth() } = options;
  const isSupported = useSupported(
    () => win && 'matchMedia' in win && typeof win.matchMedia === 'function',
  );

  const ssrSupport = signal(typeof ssrWidth === 'number');

  const mediaQuery = signal<MediaQueryList | undefined>(undefined);
  const matches = signal(false);

  const handler = (event: MediaQueryListEvent) => {
    matches.set(event.matches);
  };

  // Use effect to reactively watch the query
  syncEffect(() => {
    if (ssrSupport()) {
      // Exit SSR support on mounted if window available
      untracked(() => {
        ssrSupport.set(!isSupported());
      });

      const queryStrings = toValue(query).split(',');
      let result = false;
      for (const queryString of queryStrings) {
        const not = queryString.includes('not all');
        const minWidth = queryString.match(/\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
        const maxWidth = queryString.match(/\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/);
        let res = Boolean(minWidth || maxWidth);
        if (minWidth && res) {
          res = ssrWidth! >= pxValue(minWidth[1]);
        }
        if (maxWidth && res) {
          res = ssrWidth! <= pxValue(maxWidth[1]);
        }
        result = not ? !res : res;
        if (result) break;
      }
      untracked(() => {
        matches.set(result);
      });
      return;
    }
    if (!isSupported()) return;
    untracked(() => {
      mediaQuery.set(win!.matchMedia(toValue(query)));
      matches.set(mediaQuery()!.matches);
    });
  });

  useEventListener(mediaQuery, 'change', handler, { passive: true });

  return computed(() => matches());
}
