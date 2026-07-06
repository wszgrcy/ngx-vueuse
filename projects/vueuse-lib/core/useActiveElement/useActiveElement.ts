import { type Signal, signal } from '@angular/core';
import {
  ConfigurableDocumentOrShadowRoot,
  ConfigurableWindow,
  defaultWindow,
} from '../_configurable';
import { onElementRemoval } from '../onElementRemoval';
import { useEventListener } from '../useEventListener';

export interface UseActiveElementOptions
  extends ConfigurableWindow, ConfigurableDocumentOrShadowRoot {
  /**
   * Search active element deeply inside shadow dom
   * @default true
   */
  deep?: boolean;
  /**
   * Track active element when it's removed from the DOM
   * Using a MutationObserver under the hood
   * @default false
   */
  triggerOnRemoval?: boolean;
}

export type UseActiveElementReturn<T extends HTMLElement = HTMLElement> = Signal<
  T | null | undefined
>;

/**
 * Reactive `document.activeElement`
 *
 * @see https://vueuse.org/useActiveElement
 * @param options
 * @returns A signal that tracks the currently active element
 *
 * @example
 * ```ts
 * const activeElement = useActiveElement()
 * console.log(activeElement()?.tagName) // Currently focused element
 * ```
 */
export function useActiveElement<T extends HTMLElement = HTMLElement>(
  options: UseActiveElementOptions = {},
): UseActiveElementReturn<T> {
  const { window = defaultWindow, deep = true, triggerOnRemoval = false } = options;

  const document = options.document ?? window?.document;
  /**
   * Get deep active element (traversing shadow DOM)
   */
  function getDeepActiveElement(): HTMLElement | null | undefined {
    let element = document?.activeElement as HTMLElement | null | undefined;
    if (deep) {
      while (element?.shadowRoot) {
        element = element.shadowRoot?.activeElement as HTMLElement | null | undefined;
      }
    }
    return element;
  }
  const activeElement = signal<T | null | undefined>(undefined);

  const trigger = () => {
    activeElement.set(getDeepActiveElement() as T | null | undefined);
  };

  if (window) {
    const listenerOptions = {
      capture: true,
      passive: true,
    };

    useEventListener(
      window,
      'blur',
      (event: Event & { relatedTarget?: unknown }) => {
        if (event.relatedTarget !== null) return;
        trigger();
      },
      listenerOptions,
    );
    useEventListener(window, 'focus', trigger, listenerOptions);
  }

  if (triggerOnRemoval) {
    onElementRemoval(activeElement, trigger, { document });
  }

  trigger();

  return activeElement as UseActiveElementReturn<T>;
}
