import type { Signal } from '@angular/core';
import type { PointerType } from '../types';
import type { MaybeElementRef } from '../unrefElement';
import { toRef } from '@cyia/ngx-vueuse/shared';
import { computed, signal } from '@angular/core';
import { useEventListener } from '../useEventListener';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { shallowReadonly } from '@cyia/ngx-vueuse/shared';
import type { UseSwipeDirection } from '../useSwipe';

export interface UsePointerSwipeOptions {
  /**
   * @default 50
   */
  threshold?: number;

  /**
   * Callback on swipe start.
   */
  onSwipeStart?: (e: PointerEvent) => void;

  /**
   * Callback on swipe move.
   */
  onSwipe?: (e: PointerEvent) => void;

  /**
   * Callback on swipe end.
   */
  onSwipeEnd?: (e: PointerEvent, direction: UseSwipeDirection) => void;

  /**
   * Pointer types to listen to.
   *
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: PointerType[];

  /**
   * Disable text selection on swipe.
   *
   * @default false
   */
  disableTextSelect?: boolean;
}

export interface UsePointerSwipeReturn {
  readonly isSwiping: Signal<boolean>;
  readonly direction: Signal<UseSwipeDirection>;
  readonly posStart: { readonly x: Signal<number>; readonly y: Signal<number> };
  readonly posEnd: { readonly x: Signal<number>; readonly y: Signal<number> };
  readonly distanceX: Signal<number>;
  readonly distanceY: Signal<number>;
  stop: () => void;
}

/**
 * Reactive swipe detection based on PointerEvents.
 *
 * @see https://vueuse.org/usePointerSwipe
 * @param target
 * @param options
 */
export function usePointerSwipe(
  target: MaybeElementRef<HTMLElement | null | undefined>,
  options: UsePointerSwipeOptions = {},
): UsePointerSwipeReturn {
  const targetRef = toRef(target);

  const { threshold = 50, onSwipe, onSwipeEnd, onSwipeStart, disableTextSelect = false } = options;

  const posStart = { x: signal(0), y: signal(0) };
  const updatePosStart = (x: number, y: number) => {
    posStart.x.set(x);
    posStart.y.set(y);
  };

  const posEnd = { x: signal(0), y: signal(0) };
  const updatePosEnd = (x: number, y: number) => {
    posEnd.x.set(x);
    posEnd.y.set(y);
  };

  const distanceX = computed(() => posStart.x() - posEnd.x());
  const distanceY = computed(() => posStart.y() - posEnd.y());

  const { max, abs } = Math;
  const isThresholdExceeded = computed(() => max(abs(distanceX()), abs(distanceY())) >= threshold);
  const isSwiping = signal(false);
  const isPointerDown = signal(false);

  const direction = computed(() => {
    if (!isThresholdExceeded()) return 'none' as const;

    if (abs(distanceX()) > abs(distanceY())) {
      return distanceX() > 0 ? ('left' as const) : ('right' as const);
    } else {
      return distanceY() > 0 ? ('up' as const) : ('down' as const);
    }
  });

  const eventIsAllowed = (e: PointerEvent): boolean => {
    const isReleasingButton = e.buttons === 0;
    const isPrimaryButton = e.buttons === 1;
    return (
      options.pointerTypes?.includes(e.pointerType as PointerType) ??
      (isReleasingButton || isPrimaryButton) ??
      true
    );
  };

  const listenerOptions = { passive: true };

  const stops = [
    useEventListener(
      target,
      'pointerdown',
      (e: PointerEvent) => {
        if (!eventIsAllowed(e)) return;
        isPointerDown.set(true);
        // Future pointer events will be retargeted to target until pointerup/cancel
        const eventTarget = e.target as HTMLElement | undefined;
        eventTarget?.setPointerCapture(e.pointerId);
        const { clientX: x, clientY: y } = e;
        updatePosStart(x, y);
        updatePosEnd(x, y);
        onSwipeStart?.(e);
      },
      listenerOptions,
    ),

    useEventListener(
      target,
      'pointermove',
      (e: PointerEvent) => {
        if (!eventIsAllowed(e)) return;
        if (!isPointerDown()) return;

        const { clientX: x, clientY: y } = e;
        updatePosEnd(x, y);
        if (!isSwiping() && isThresholdExceeded()) isSwiping.set(true);
        if (isSwiping()) onSwipe?.(e);
      },
      listenerOptions,
    ),

    useEventListener(
      target,
      ['pointerup', 'pointercancel'],
      (e: PointerEvent) => {
        if (!eventIsAllowed(e)) return;
        if (isSwiping()) onSwipeEnd?.(e, direction());

        isPointerDown.set(false);
        isSwiping.set(false);
      },
      listenerOptions,
    ),
  ];

  tryOnMounted(() => {
    const el = targetRef();
    const element = el ? (typeof el === 'function' ? el() : el) : null;
    // Allow vertical scrolling, disable horizontal scrolling by touch
    element?.style?.setProperty('touch-action', 'pan-y');

    if (disableTextSelect) {
      // Disable text selection on swipe
      element?.style?.setProperty('-webkit-user-select', 'none');
      element?.style?.setProperty('-ms-user-select', 'none');
      element?.style?.setProperty('user-select', 'none');
    }
  });

  const stop = () => stops.forEach((s) => s());

  return {
    isSwiping: shallowReadonly(isSwiping),
    direction: shallowReadonly(direction),
    posStart: {
      x: shallowReadonly(posStart.x),
      y: shallowReadonly(posStart.y),
    },
    posEnd: {
      x: shallowReadonly(posEnd.x),
      y: shallowReadonly(posEnd.y),
    },
    distanceX,
    distanceY,
    stop,
  };
}
