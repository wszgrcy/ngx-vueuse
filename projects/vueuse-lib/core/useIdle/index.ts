import type { Signal, WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import type { ConfigurableEventFilter, Stoppable } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import type { WindowEventName } from '../useEventListener';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import {
  createFilterWrapper,
  shallowReadonly,
  throttleFilter,
  timestamp,
} from '@cyia/ngx-vueuse/shared';

const defaultEvents: WindowEventName[] = [
  'mousemove',
  'mousedown',
  'resize',
  'keydown',
  'touchstart',
  'wheel',
];
const oneMinute = 60_000;

export interface UseIdleOptions extends ConfigurableWindow, ConfigurableEventFilter {
  /**
   * Event names that listen to for detected user activity
   *
   * @default ['mousemove', 'mousedown', 'resize', 'keydown', 'touchstart', 'wheel']
   */
  events?: WindowEventName[];
  /**
   * Listen for document visibility change
   *
   * @default true
   */
  listenForVisibilityChange?: boolean;
  /**
   * Initial state of the ref idle
   *
   * @default false
   */
  initialState?: boolean;
}

export interface UseIdleReturn extends Stoppable {
  idle: Signal<boolean>;
  lastActive: Signal<number>;
  reset: () => void;
}

/**
 * Tracks whether the user is being inactive.
 *
 * @see https://vueuse.org/useIdle
 * @param timeout default to 1 minute
 * @param options IdleOptions
 */
export function useIdle(timeout: number = oneMinute, options: UseIdleOptions = {}): UseIdleReturn {
  const {
    initialState = false,
    listenForVisibilityChange = true,
    events = defaultEvents,
    window = defaultWindow,
    eventFilter = throttleFilter(50),
  } = options;

  const idle = signal(initialState);
  const lastActive = signal(timestamp());
  const isPending = signal(false);

  let timer: ReturnType<typeof setTimeout> | undefined;

  const reset = () => {
    idle.set(false);
    clearTimeout(timer);
    timer = setTimeout(() => idle.set(true), timeout);
  };

  const onEvent = createFilterWrapper(eventFilter, () => {
    lastActive.set(timestamp());
    reset();
  });

  if (window) {
    const document = window.document;
    const listenerOptions = { passive: true };

    for (const event of events) {
      useEventListener(
        window,
        event,
        () => {
          if (!isPending()) return;
          onEvent();
        },
        listenerOptions,
      );
    }

    if (listenForVisibilityChange) {
      useEventListener(
        document,
        'visibilitychange',
        () => {
          if (document.hidden || !isPending()) return;
          onEvent();
        },
        listenerOptions,
      );
    }

    start();
  }

  function start() {
    if (isPending()) {
      return;
    }
    isPending.set(true);
    if (!initialState) reset();
  }

  function stop() {
    idle.set(initialState);
    clearTimeout(timer);
    isPending.set(false);
  }

  return {
    idle,
    lastActive,
    reset,
    stop,
    start,
    isPending: shallowReadonly(isPending as WritableSignal<boolean>),
  };
}
