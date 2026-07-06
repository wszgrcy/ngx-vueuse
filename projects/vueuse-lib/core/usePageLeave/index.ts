import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';

export interface UsePageLeaveOptions extends ConfigurableWindow {}

export type UsePageLeaveReturn = Signal<boolean>;

/**
 * Reactive state to show whether mouse leaves the page.
 *
 * @see https://vueuse.org/usePageLeave
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePageLeave(options: UsePageLeaveOptions = {}): UsePageLeaveReturn {
  const { window = defaultWindow } = options;
  const isLeft = signal(false);

  const handler = (event: MouseEvent) => {
    if (!window) return;

    event = event || (window.event as any);
    // @ts-expect-error missing types
    const from = event.relatedTarget || event.toElement;
    isLeft.set(!from);
  };

  if (window) {
    const listenerOptions = { passive: true };
    useEventListener(window, 'mouseout', handler, listenerOptions);
    useEventListener(window.document, 'mouseleave', handler, listenerOptions);
    useEventListener(window.document, 'mouseenter', handler, listenerOptions);
  }

  return isLeft;
}
