import type { ConfigurableDocument } from '../_configurable';
import { defaultDocument } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { signal } from '@angular/core';

export interface UseDocumentVisibilityOptions extends ConfigurableDocument {}

export interface UseDocumentVisibilityReturn {
  (): DocumentVisibilityState;
  value: DocumentVisibilityState;
}

/**
 * Reactively track `document.visibilityState`.
 *
 * @see https://vueuse.org/useDocumentVisibility
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useDocumentVisibility(
  options: UseDocumentVisibilityOptions = {},
): UseDocumentVisibilityReturn {
  const { document = defaultDocument } = options;
  if (!document) {
    const s = signal('visible' as DocumentVisibilityState);
    return Object.assign(s, { value: 'visible' }) as UseDocumentVisibilityReturn;
  }

  const visibility = signal(document.visibilityState);

  useEventListener(
    document as any,
    'visibilitychange',
    () => {
      visibility.set(document.visibilityState);
    },
    { passive: true },
  );

  // Add value property for Vue compatibility
  const result = visibility as unknown as UseDocumentVisibilityReturn;
  Object.defineProperty(result, 'value', {
    get: () => visibility(),
    set: (v: DocumentVisibilityState) => visibility.set(v),
    enumerable: true,
    configurable: true,
  });

  return result;
}
