import type { UseTitleOptions, UseTitleOptionsBase, UseTitleReturn } from './types';
import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultDocument } from '../_configurable';
import { useMutationObserver } from '../useMutationObserver';
import { syncEffect } from '@cyia/ngx-vueuse/patch';
import { signal, type WritableSignal } from '@angular/core';

export type { UseTitleOptionsBase, UseTitleOptions, UseTitleReturn };

/**
 * Reactive document title.
 *
 * @see https://vueuse.org/useTitle
 * @param newTitle
 * @param options
 * @description It's not SSR compatible. Your value will be applied only on client-side.
 */
export function useTitle(
  newTitle: SignalOrValue<string | null | undefined> = null,
  options: UseTitleOptions = {},
): WritableSignal<string | null | undefined> {
  const { document = defaultDocument, restoreOnUnmount = (t) => t } = options;
  const originalTitle = document?.title ?? '';

  const title: WritableSignal<string | null | undefined> = signal(
    toValue(newTitle ?? document?.title ?? null),
  );
  const isReadonly = !!(newTitle && typeof newTitle === 'function');
  let previousTitle: string | null | undefined;

  function format(t: string) {
    if (!('titleTemplate' in options)) return t;
    const template = options.titleTemplate || '%s';
    return typeof template === 'function' ? template(t) : toValue(template).replace(/%s/g, t);
  }

  syncEffect(() => {
    const newValue = title();
    if (newValue !== previousTitle && document) {
      document.title = format(newValue ?? '');
      previousTitle = newValue;
    }
  });

  if (
    'observe' in options &&
    options.observe &&
    !('titleTemplate' in options) &&
    document &&
    !isReadonly
  ) {
    useMutationObserver(
      document.head?.querySelector('title'),
      () => {
        if (document && document.title !== title()) title.set(format(document.title));
      },
      { childList: true },
    );
  }

  tryOnScopeDispose(() => {
    if (restoreOnUnmount) {
      const restoredTitle = restoreOnUnmount(originalTitle, title() || '');
      if (restoredTitle != null && document) document.title = restoredTitle;
    }
  });

  return title;
}
