import type { Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { MaybeComputedElementRef } from '../unrefElement';
import type { UseMouseSourceType } from '../useMouse';
import { computed, signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';

export interface UseMousePressedOptions extends ConfigurableWindow {
  /**
   * Listen to `touchstart` `touchend` events
   *
   * @default true
   */
  touch?: boolean;

  /**
   * Listen to `dragstart` `drop` and `dragend` events
   *
   * @default true
   */
  drag?: boolean;

  /**
   * Add event listeners with the `capture` option set to `true`
   * (see [MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#capture))
   *
   * @default false
   */
  capture?: boolean;

  /**
   * Initial values
   *
   * @default false
   */
  initialValue?: boolean;

  /**
   * Element target to be capture the click
   */
  target?: MaybeComputedElementRef;

  /**
   * Callback to be called when the mouse is pressed
   *
   * @param event
   */
  onPressed?: (event: MouseEvent | TouchEvent | DragEvent) => void;

  /**
   * Callback to be called when the mouse is released
   *
   * @param event
   */
  onReleased?: (event: MouseEvent | TouchEvent | DragEvent) => void;
}

/** @deprecated use {@link UseMousePressedOptions} instead */
export type MousePressedOptions = UseMousePressedOptions;

export interface UseMousePressedReturn {
  pressed: Signal<boolean>;
  sourceType: Signal<UseMouseSourceType>;
  /** @internal Cleanup function for testing */
  _cleanup?: () => void;
}

/**
 * Reactive mouse pressing state.
 *
 * @see https://vueuse.org/useMousePressed
 * @param options
 */
export function useMousePressed(options: UseMousePressedOptions = {}): UseMousePressedReturn {
  const {
    touch = true,
    drag = true,
    capture = false,
    initialValue = false,
    window = defaultWindow,
  } = options;

  const pressed = signal(initialValue);
  const sourceType = signal<UseMouseSourceType>(null);

  if (!window) {
    return {
      pressed,
      sourceType,
    };
  }

  const onPressed =
    (srcType: UseMouseSourceType) => (event: MouseEvent | TouchEvent | DragEvent) => {
      pressed.set(true);
      sourceType.set(srcType);
      options.onPressed?.(event);
    };
  const onReleased = (event: MouseEvent | TouchEvent | DragEvent) => {
    pressed.set(false);
    sourceType.set(null);
    options.onReleased?.(event);
  };

  const target = computed(() => unrefElement(options.target) || window);

  const listenerOptions = { passive: true, capture };
  const cleanupFns = [
    useEventListener<MouseEvent>(target, 'mousedown', onPressed('mouse'), listenerOptions),
    useEventListener<MouseEvent>(window, 'mouseleave', onReleased, listenerOptions),
    useEventListener<MouseEvent>(window, 'mouseup', onReleased, listenerOptions),
  ];

  if (drag) {
    cleanupFns.push(
      useEventListener<DragEvent>(target, 'dragstart', onPressed('mouse'), listenerOptions),
    );
    cleanupFns.push(useEventListener<DragEvent>(window, 'drop', onReleased, listenerOptions));
    cleanupFns.push(useEventListener<DragEvent>(window, 'dragend', onReleased, listenerOptions));
  }

  if (touch) {
    cleanupFns.push(
      useEventListener<TouchEvent>(target, 'touchstart', onPressed('touch'), listenerOptions),
    );
    cleanupFns.push(useEventListener<TouchEvent>(window, 'touchend', onReleased, listenerOptions));
    cleanupFns.push(
      useEventListener<TouchEvent>(window, 'touchcancel', onReleased, listenerOptions),
    );
  }

  return {
    pressed,
    sourceType,
    // Expose cleanup function for testing
    _cleanup: () => cleanupFns.forEach((fn) => fn()),
  };
}
