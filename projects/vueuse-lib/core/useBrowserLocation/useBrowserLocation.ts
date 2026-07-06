import {
  type Signal,
  type WritableSignal,
  signal,
  effect,
  DestroyRef,
  inject,
} from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';

const WRITABLE_PROPERTIES = [
  'hash',
  'host',
  'hostname',
  'href',
  'pathname',
  'port',
  'protocol',
  'search',
] as const;

export interface UseBrowserLocationOptions extends ConfigurableWindow {}

export interface BrowserLocationState {
  readonly trigger: string;
  readonly state?: any;
  readonly length?: number;
  readonly origin?: string;
  hash?: string;
  host?: string;
  hostname?: string;
  href?: string;
  pathname?: string;
  port?: string;
  protocol?: string;
  search?: string;
}

/**
 * Reactive browser location.
 *
 * @see https://vueuse.org/useBrowserLocation
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useBrowserLocation(
  options: UseBrowserLocationOptions = {},
): Signal<BrowserLocationState> {
  const { window = defaultWindow } = options;
  const refs: Record<string, WritableSignal<string | undefined>> = Object.fromEntries(
    WRITABLE_PROPERTIES.map((key) => [key, signal(undefined)]),
  ) as Record<(typeof WRITABLE_PROPERTIES)[number], WritableSignal<string | undefined>>;

  const buildState = (trigger: string): BrowserLocationState => {
    const { state, length } = window?.history || {};
    const { origin } = window?.location || {};

    for (const key of WRITABLE_PROPERTIES) refs[key].set(window?.location?.[key]);

    const result = {
      trigger,
      state,
      length: length as number,
      origin: origin as string,
    } as BrowserLocationState;

    for (const key of WRITABLE_PROPERTIES) {
      (result as Record<string, any>)[key] = refs[key]();
    }

    return result;
  };

  const state = signal(buildState('load'));

  for (const [key, ref] of Object.entries(refs)) {
    effect(() => {
      const value = ref();
      if (!window?.location) return;
      const location = window.location as Record<string, any>;
      if (location[key] === value) return;
      location[key] = value;
    });
  }

  if (window) {
    const listenerOptions = { passive: true };
    useEventListener(
      window,
      'popstate',
      () => {
        state.set(buildState('popstate'));
      },
      listenerOptions,
    );
    useEventListener(
      window,
      'hashchange',
      () => {
        state.set(buildState('hashchange'));
      },
      listenerOptions,
    );
  }

  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => {
    // Cleanup if needed
  });

  return state;
}
