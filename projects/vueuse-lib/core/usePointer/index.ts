import type { PointerType, Position } from '../types';
import { objectPick } from '@cyia/ngx-vueuse/shared';
import { toRefs } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { signal, type Signal } from '@angular/core';

export interface UsePointerState extends Position {
  pressure: number;
  pointerId: number;
  tiltX: number;
  tiltY: number;
  width: number;
  height: number;
  twist: number;
  pointerType: PointerType | null;
}

export interface UsePointerOptions {
  /**
   * Pointer types that listen to.
   *
   * @default ['mouse', 'touch', 'pen']
   */
  pointerTypes?: PointerType[];

  /**
   * Initial values
   */
  initialValue?: Partial<UsePointerState>;

  /**
   * @default window
   */
  target?: EventTarget | null | undefined;
}

export interface UsePointerReturn {
  pressure: Signal<number>;
  pointerId: Signal<number>;
  tiltX: Signal<number>;
  tiltY: Signal<number>;
  width: Signal<number>;
  height: Signal<number>;
  twist: Signal<number>;
  pointerType: Signal<PointerType | null>;
  x: Signal<number>;
  y: Signal<number>;
  isInside: Signal<boolean>;
}

const defaultState: UsePointerState = {
  x: 0,
  y: 0,
  pointerId: 0,
  pressure: 0,
  tiltX: 0,
  tiltY: 0,
  width: 0,
  height: 0,
  twist: 0,
  pointerType: null,
};
const keys = Object.keys(defaultState) as (keyof UsePointerState)[];

/**
 * Reactive pointer state.
 *
 * @see https://vueuse.org/usePointer
 * @param options
 */
export function usePointer(options: UsePointerOptions = {}): UsePointerReturn {
  const { target = defaultWindow } = options;

  const isInside = signal(false);
  const state = signal<UsePointerState>({ ...defaultState, ...options.initialValue });

  const handler = (event: PointerEvent) => {
    isInside.set(true);
    if (options.pointerTypes && !options.pointerTypes.includes(event.pointerType as PointerType))
      return;

    state.set(objectPick(event, keys, false) as UsePointerState);
  };

  if (target) {
    const listenerOptions = { passive: true };
    useEventListener(target, ['pointerdown', 'pointermove', 'pointerup'], handler, listenerOptions);
    useEventListener(target, 'pointerleave', () => isInside.set(false), listenerOptions);
  }

  return {
    ...toRefs(state),
    isInside,
  };
}
