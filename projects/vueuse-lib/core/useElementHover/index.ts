import type { TimerHandle } from '@cyia/ngx-vueuse/shared';
import { computed, type Signal, signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { MaybeComputedElementRef, MaybeElement } from '../unrefElement';
import { defaultWindow } from '../_configurable';
import { onElementRemoval } from '../onElementRemoval';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';

type MaybeRefOrGetter<T> = SignalOrGetter<T>;
type SignalOrGetter<T> = T | (() => T);

export interface UseElementHoverOptions extends ConfigurableWindow {
  delayEnter?: number;
  delayLeave?: number;
  triggerOnRemoval?: boolean;
}

export function useElementHover(
  el: MaybeRefOrGetter<EventTarget | null | undefined>,
  options: UseElementHoverOptions = {},
): Signal<boolean> {
  const {
    delayEnter = 0,
    delayLeave = 0,
    triggerOnRemoval = false,
    window = defaultWindow,
  } = options;

  const isHovered = signal(false);
  let timer: TimerHandle;

  const toggle = (entering: boolean) => {
    const delay = entering ? delayEnter : delayLeave;
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }

    if (delay) timer = setTimeout(() => isHovered.set(entering), delay);
    else isHovered.set(entering);
  };

  if (!window) return isHovered;

  useEventListener(el, 'mouseenter', () => toggle(true), { passive: true });
  useEventListener(el, 'mouseleave', () => toggle(false), { passive: true });

  if (triggerOnRemoval) {
    onElementRemoval(
      computed(() => unrefElement(el as MaybeComputedElementRef<MaybeElement>)),
      () => toggle(false),
    );
  }

  return isHovered;
}
