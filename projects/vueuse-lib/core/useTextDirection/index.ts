import type { ConfigurableDocument } from '../_configurable';
import type { MaybeElement } from '../unrefElement';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { computed, signal } from '@angular/core';
import { defaultDocument } from '../_configurable';
import { useMutationObserver } from '../useMutationObserver';

export type UseTextDirectionValue = 'ltr' | 'rtl' | 'auto';

export interface UseTextDirectionOptions extends ConfigurableDocument {
  /**
   * CSS Selector for the target element applying to
   *
   * @default 'html'
   */
  selector?: string;
  /**
   * Observe `document.querySelector(selector)` changes using MutationObserve
   *
   * @default false
   */
  observe?: boolean;
  /**
   * Initial value
   *
   * @default 'ltr'
   */
  initialValue?: UseTextDirectionValue;
}

/**
 * Reactive dir of the element's text.
 *
 * @see https://vueuse.org/useTextDirection
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useTextDirection(options: UseTextDirectionOptions = {}) {
  const {
    document = defaultDocument,
    selector = 'html',
    observe = false,
    initialValue = 'ltr',
  } = options;

  function getValue() {
    return (
      (document?.querySelector(selector)?.getAttribute('dir') as UseTextDirectionValue) ??
      initialValue
    );
  }

  const dir = signal<UseTextDirectionValue>(getValue());

  tryOnMounted(() => dir.set(getValue()));

  if (observe && document) {
    useMutationObserver(
      document.querySelector(selector) as MaybeElement,
      () => dir.set(getValue()),
      { attributes: true },
    );
  }

  const result = computed(() => dir());

  // Override the result to also be writable
  Object.defineProperty(result, 'set', {
    value: (v: UseTextDirectionValue) => {
      dir.set(v);
      if (!document) return;
      if (dir()) document.querySelector(selector)?.setAttribute('dir', dir());
      else document.querySelector(selector)?.removeAttribute('dir');
    },
    writable: true,
  });

  return result as any;
}
