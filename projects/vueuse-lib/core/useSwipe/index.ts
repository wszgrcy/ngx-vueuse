import type { Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { Position } from '../types';
import { computed, signal } from '@angular/core';
import { useEventListener } from '../useEventListener';

export type UseSwipeDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export interface UseSwipeOptions extends ConfigurableWindow {
  /**
   * Register events as passive
   *
   * @default true
   */
  passive?: boolean;

  /**
   * @default 50
   */
  threshold?: number;

  /**
   * Callback on swipe start
   */
  onSwipeStart?: (e: TouchEvent) => void;

  /**
   * Callback on swipe moves
   */
  onSwipe?: (e: TouchEvent) => void;

  /**
   * Callback on swipe ends
   */
  onSwipeEnd?: (e: TouchEvent, direction: UseSwipeDirection) => void;
}

export interface UseSwipeReturn {
  isSwiping: Signal<boolean>;
  direction: Signal<UseSwipeDirection>;
  coordsStart: Position;
  coordsEnd: Position;
  lengthX: Signal<number>;
  lengthY: Signal<number>;
  stop: () => void;
}

/**
 * Reactive swipe detection.
 *
 * @see https://vueuse.org/useSwipe
 * @param target
 * @param options
 */
export function useSwipe(
  target:
    | Signal<EventTarget | null | undefined>
    | EventTarget
    | null
    | undefined
    | (() => EventTarget | null | undefined),
  options: UseSwipeOptions = {},
): UseSwipeReturn {
  const { threshold = 50, onSwipe, onSwipeEnd, onSwipeStart, passive = true } = options;

  // Use signals with internal state to replicate reactive object behavior
  const startXSignal = signal(0);
  const startYSignal = signal(0);
  const endXSignal = signal(0);
  const endYSignal = signal(0);

  // Create readonly Position objects that update reactively
  const coordsStart: Position = {
    get x() {
      return startXSignal();
    },
    get y() {
      return startYSignal();
    },
    set x(v: number) {
      startXSignal.set(v);
    },
    set y(v: number) {
      startYSignal.set(v);
    },
  };

  const coordsEnd: Position = {
    get x() {
      return endXSignal();
    },
    get y() {
      return endYSignal();
    },
    set x(v: number) {
      endXSignal.set(v);
    },
    set y(v: number) {
      endYSignal.set(v);
    },
  };

  const diffX = computed(() => startXSignal() - endXSignal());
  const diffY = computed(() => startYSignal() - endYSignal());

  const { max, abs } = Math;
  const isThresholdExceeded = computed(() => max(abs(diffX()), abs(diffY())) >= threshold!);

  const isSwiping = signal(false);

  const direction = computed((): UseSwipeDirection => {
    if (!isThresholdExceeded()) return 'none';

    if (abs(diffX()) > abs(diffY())) {
      return diffX() > 0 ? 'left' : 'right';
    } else {
      return diffY() > 0 ? 'up' : 'down';
    }
  });

  const getTouchEventCoords = (e: TouchEvent) => [e.touches[0].clientX, e.touches[0].clientY];

  const updateCoordsStart = (x: number, y: number) => {
    startXSignal.set(x);
    startYSignal.set(y);
  };

  const updateCoordsEnd = (x: number, y: number) => {
    endXSignal.set(x);
    endYSignal.set(y);
  };

  const listenerOptions = { passive, capture: !passive };

  const onTouchEnd = (e: TouchEvent) => {
    if (isSwiping()) onSwipeEnd?.(e, direction());

    isSwiping.set(false);
  };

  const stops = [
    useEventListener(
      target,
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        const [x, y] = getTouchEventCoords(e);
        updateCoordsStart(x, y);
        updateCoordsEnd(x, y);
        onSwipeStart?.(e);
      },
      listenerOptions,
    ),

    useEventListener(
      target,
      'touchmove',
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        const [x, y] = getTouchEventCoords(e);
        updateCoordsEnd(x, y);
        if (
          listenerOptions.capture &&
          !listenerOptions.passive &&
          Math.abs(diffX()) > Math.abs(diffY())
        )
          e.preventDefault();
        if (!isSwiping() && isThresholdExceeded()) isSwiping.set(true);
        if (isSwiping()) onSwipe?.(e);
      },
      listenerOptions,
    ),

    useEventListener(target, ['touchend', 'touchcancel'], onTouchEnd, listenerOptions),
  ];

  const stop = () => stops.forEach((s) => s());

  return {
    isSwiping,
    direction,
    coordsStart,
    coordsEnd,
    lengthX: diffX,
    lengthY: diffY,
    stop,
  };
}
