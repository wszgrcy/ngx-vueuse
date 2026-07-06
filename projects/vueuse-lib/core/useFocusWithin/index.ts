import type { Signal } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { MaybeElementRef } from '../unrefElement';
import { defaultWindow } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useActiveElement } from '../useActiveElement';
import { useEventListener } from '../useEventListener';

export interface UseFocusWithinOptions extends ConfigurableWindow {
  /**
   * Search active element deeply inside shadow dom
   * @default true
   */
  deep?: boolean;
}

export interface UseFocusWithinReturn {
  /**
   * True if the element or any of its descendants are focused
   */
  focused: Signal<boolean>;
}

const EVENT_FOCUS_IN = 'focusin';
const EVENT_FOCUS_OUT = 'focusout';
const PSEUDO_CLASS_FOCUS_WITHIN = ':focus-within';

/**
 * Track if focus is contained within the target element
 *
 * @see https://vueuse.org/useFocusWithin
 * @param target The target element to track
 * @param options Focus within options
 */
export function useFocusWithin(
  target: MaybeElementRef,
  options: UseFocusWithinOptions = {},
): UseFocusWithinReturn {
  const { window = defaultWindow } = options;
  const targetElement = computed(() => unrefElement(target));
  const _focused = signal(false);
  const focused = computed(() => _focused());
  const activeElement = useActiveElement({ deep: options.deep });

  if (!window || !activeElement()) {
    return { focused };
  }

  const listenerOptions = { passive: true };
  useEventListener(targetElement, EVENT_FOCUS_IN, () => _focused.set(true), listenerOptions);
  useEventListener(
    targetElement,
    EVENT_FOCUS_OUT,
    () => _focused.set(targetElement()?.matches?.(PSEUDO_CLASS_FOCUS_WITHIN) ?? false),
    listenerOptions,
  );

  return { focused };
}
