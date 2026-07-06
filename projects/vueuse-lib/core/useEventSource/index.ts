import type { Fn } from '@cyia/ngx-vueuse/shared';
import type { Signal, SignalOrGetter } from '@cyia/ngx-vueuse/shared';
import { isClient } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import { toRef } from '@cyia/ngx-vueuse/shared';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { useEventListener } from '../useEventListener';
import { watchImmediate } from '@cyia/ngx-vueuse/shared';

export type EventSourceStatus = 'CONNECTING' | 'OPEN' | 'CLOSED';

export interface UseEventSourceOptions<Data> extends EventSourceInit {
  /**
   * Enabled auto reconnect
   *
   * @default false
   */
  autoReconnect?:
    | boolean
    | {
        /**
         * Maximum retry time.
         *
         * Or you can pass a predicate function (which returns true if you want to retry).
         *
         * @default -1
         */
        retries?: number | (() => boolean);

        /**
         * Delay for reconnect, in milliseconds
         *
         * @default 1000
         */
        delay?: number;

        /**
         * On maximum retry time reached.
         */
        onFailed?: Fn;
      };

  /**
   * Immediately open the websocket when URL changes
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Automatically connect to the websocket when URL changes
   *
   * @default true
   */
  autoConnect?: boolean;

  /**
   * Custom data serialization
   */
  serializer?: {
    read: (v?: string) => Data;
  };
}

export interface UseEventSourceReturn<Events extends string[], Data = any> {
  /**
   * Reference to the latest data received via the EventSource,
   * can be watched to respond to incoming messages
   */
  data: Signal<Data | null>;

  /**
   * The current state of the connection, can be only one of:
   * 'CONNECTING', 'OPEN' 'CLOSED'
   */
  status: Signal<EventSourceStatus>;

  /**
   * The latest named event
   */
  event: Signal<Events[number] | null>;

  /**
   * The current error
   */
  error: Signal<Event | null>;

  /**
   * Closes the EventSource connection gracefully.
   */
  close: EventSource['close'];

  /**
   * Reopen the EventSource connection.
   * If there the current one is active, will close it before opening a new one.
   */
  open: Fn;

  /**
   * Reference to the current EventSource instance.
   */
  eventSource: Signal<EventSource | null>;

  /**
   * The last event ID string, for server-sent events.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/lastEventId
   */
  lastEventId: Signal<string | null>;
}

function resolveNestedOptions<T>(options: T | true): T {
  if (options === true) return {} as T;
  return options;
}

/**
 * Reactive wrapper for EventSource.
 *
 * @see https://vueuse.org/useEventSource
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource EventSource
 * @param url
 * @param events
 * @param options
 */
export function useEventSource<Events extends string[], Data = any>(
  url: SignalOrGetter<string | URL | undefined>,
  events: Events = [] as unknown as Events,
  options: UseEventSourceOptions<Data> = {},
): UseEventSourceReturn<Events, Data> {
  const event = signal<Events[number] | null>(null);
  const data = signal<Data | null>(null);
  const status = signal<EventSourceStatus>('CONNECTING');
  const eventSource = signal<EventSource | null>(null);
  const error = signal<Event | null>(null);
  const urlRef = toRef(url);
  const lastEventId = signal<string | null>(null);

  let explicitlyClosed = false;
  let retried = 0;

  const {
    withCredentials = false,
    immediate = true,
    autoConnect = true,
    autoReconnect,
    serializer = {
      read: (v?: string) => v as Data,
    },
  } = options;

  const close = () => {
    if (isClient && eventSource()) {
      eventSource()!.close();
      eventSource.set(null);
      status.set('CLOSED');
      explicitlyClosed = true;
    }
  };

  const _init = () => {
    if (explicitlyClosed || typeof urlRef() === 'undefined') return;

    const es = new EventSource(urlRef() as string, { withCredentials });

    status.set('CONNECTING');

    eventSource.set(es);

    es.onopen = () => {
      status.set('OPEN');
      error.set(null);
    };

    es.onerror = (e) => {
      status.set('CLOSED');
      error.set(e);

      // only reconnect if EventSource isn't reconnecting by itself
      // this is the case when the connection is closed (readyState is 2)
      if (es.readyState === 2 && !explicitlyClosed && autoReconnect) {
        es.close();
        const { retries = -1, delay = 1000, onFailed } = resolveNestedOptions(autoReconnect);
        retried += 1;

        if (typeof retries === 'number' && (retries < 0 || retried < retries))
          setTimeout(_init, delay);
        else if (typeof retries === 'function' && retries()) setTimeout(_init, delay);
        else onFailed?.();
      }
    };

    es.onmessage = (e: MessageEvent) => {
      event.set(null);
      data.set(serializer.read(e.data) ?? null);
      lastEventId.set(e.lastEventId);
    };

    for (const event_name of events) {
      useEventListener(
        es,
        event_name,
        (e: Event & { data?: string; lastEventId?: string }) => {
          event.set(event_name);
          data.set(serializer.read(e.data) ?? null);
          lastEventId.set(e.lastEventId ?? null);
        },
        { passive: true },
      );
    }
  };

  const open = () => {
    if (!isClient) return;
    close();
    explicitlyClosed = false;
    retried = 0;
    _init();
  };

  if (immediate) open();

  if (autoConnect) watchImmediate(urlRef, () => open());

  tryOnScopeDispose(close);

  return {
    eventSource,
    event,
    data,
    status,
    error,
    open,
    close,
    lastEventId,
  };
}
