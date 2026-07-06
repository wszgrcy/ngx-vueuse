import type { Signal } from '@angular/core';
import type { ConfigurableDocument } from '../_configurable';
import { signal } from '@angular/core';
import { defaultDocument } from '../_configurable';
import { watch } from '@cyia/ngx-vueuse/patch';

type SignalOrGetter<T> = T | (() => T);

function toValue<T>(v: SignalOrGetter<T>): T {
  return typeof v === 'function' ? (v as () => T)() : v;
}

export interface UseFaviconOptions extends ConfigurableDocument {
  baseUrl?: string;
  rel?: string;
}

type MaybeRefOrGetter<T> = T | (() => T);

/**
 * Reactive favicon.
 *
 * @see https://vueuse.org/useFavicon
 * @param newIcon
 * @param options
 */
export function useFavicon(
  newIcon: MaybeRefOrGetter<string | null | undefined> = null,
  options: UseFaviconOptions = {},
): Signal<string | null | undefined> {
  const { baseUrl = '', rel = 'icon', document = defaultDocument } = options;

  // Use a signal to hold the favicon value, analogous to Vue's toRef
  const favicon = signal(toValue(newIcon));

  const applyIcon = (icon: string) => {
    const elements = document?.head.querySelectorAll<HTMLLinkElement>(`link[rel*="${rel}"]`);
    if (!elements || elements.length === 0) {
      const link = document?.createElement('link');
      if (link) {
        link.rel = rel;
        link.href = `${baseUrl}${icon}`;
        link.type = `image/${icon.split('.').pop()}`;
        document?.head.append(link);
      }
      return;
    }
    elements?.forEach((el) => (el.href = `${baseUrl}${icon}`));
  };

  watch(
    favicon,
    (i, o) => {
      if (typeof i === 'string' && i !== o) applyIcon(i);
    },
    { immediate: true },
  );

  return favicon;
}
