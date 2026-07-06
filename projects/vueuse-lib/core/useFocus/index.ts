import type { ConfigurableWindow } from '../_configurable';
import type { MaybeElementRef } from '../unrefElement';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import { computed, signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';
import { toValue } from '@cyia/ngx-vueuse/shared';

export interface UseFocusOptions extends ConfigurableWindow {
  /**
   * Initial value. If set true, then focus will be set on the target
   *
   * @default false
   */
  initialValue?: boolean;

  /**
   * Replicate the :focus-visible behavior of CSS
   *
   * @default false
   */
  focusVisible?: boolean;

  /**
   * Prevent scrolling to the element when it is focused.
   *
   * @default false
   */
  preventScroll?: boolean;
}

export interface UseFocusReturn {
  /**
   * If read as true, then the element has focus. If read as false, then the element does not have focus
   * If set to true, then the element will be focused. If set to false, the element will be blurred.
   */
  focused: { get value(): boolean; set value(v: boolean) };
}

/**
 * Track or set the focus state of a DOM element.
 *
 * @see https://vueuse.org/useFocus
 * @param target The target element for the focus and blur events.
 * @param options
 */
export function useFocus(
  target: MaybeRefOrGetter<MaybeElementRef>,
  options: UseFocusOptions = {},
): UseFocusReturn {
  const { initialValue = false, focusVisible = false, preventScroll = false } = options;

  const innerFocused = signal(false);
  const targetElement = computed(() => unrefElement(toValue(target)));

  const listenerOptions = { passive: true };
  useEventListener(
    targetElement,
    'focus',
    (event) => {
      if (!focusVisible || (event.target as HTMLElement).matches?.(':focus-visible'))
        innerFocused.set(true);
    },
    listenerOptions,
  );
  useEventListener(targetElement, 'blur', () => innerFocused.set(false), listenerOptions);

  const focused: UseFocusReturn['focused'] = {
    get value(): boolean {
      return innerFocused();
    },
    set value(v: boolean) {
      if (!v && innerFocused()) targetElement()?.blur();
      else if (v && !innerFocused()) targetElement()?.focus({ preventScroll });
    },
  };

  watch(
    targetElement,
    () => {
      // Simulate flush: 'post' by deferring to microtask
      queueMicrotask(() => {
        focused.value = initialValue;
      });
    },
    { immediate: true },
  );

  return { focused };
}
