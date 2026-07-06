import { signal, type Signal, afterNextRender } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

export interface UseBroadcastChannelOptions extends ConfigurableWindow {
  /**
   * The name of the channel.
   */
  name: string;
}

export interface UseBroadcastChannelReturn<D, P> extends Supportable {
  channel: Signal<BroadcastChannel | undefined>;
  data: Signal<D | undefined>;
  post: (data: P) => void;
  close: () => void;
  error: Signal<Event | null>;
  isClosed: Signal<boolean>;
}

/**
 * Reactive BroadcastChannel
 *
 * @see https://vueuse.org/useBroadcastChannel
 * @see https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
 * @param options
 *
 */
export function useBroadcastChannel<D, P>(
  options: UseBroadcastChannelOptions,
): UseBroadcastChannelReturn<D, P> {
  const { name, window = defaultWindow } = options;

  const isSupported = useSupported(() => window && 'BroadcastChannel' in window);
  const isClosed = signal(false);

  const channel = signal<BroadcastChannel | undefined>(undefined);
  const data = signal<D | undefined>(undefined);
  const error = signal<Event | null>(null);

  const post = (data: unknown) => {
    const ch = channel();
    if (ch) ch.postMessage(data);
  };

  const close = () => {
    const ch = channel();
    if (ch) {
      ch.close();
      isClosed.set(true);
    }
  };

  if (isSupported()) {
    afterNextRender(() => {
      error.set(null);
      channel.set(new BroadcastChannel(name));

      const listenerOptions = {
        passive: true,
      };

      useEventListener(
        channel(),
        'message',
        (e: MessageEvent) => {
          data.set(e.data);
        },
        listenerOptions,
      );

      useEventListener(
        channel(),
        'messageerror',
        (e: MessageEvent) => {
          error.set(e);
        },
        listenerOptions,
      );

      useEventListener(
        channel(),
        'close',
        () => {
          isClosed.set(true);
        },
        listenerOptions,
      );
    });
  }

  tryOnScopeDispose(() => {
    close();
  });

  return {
    isSupported,
    channel,
    data,
    post,
    close,
    error,
    isClosed,
  };
}
