import type { Fn, TimerHandle, AnyFn, Signal } from '@cyia/ngx-vueuse/shared';
import type { SignalOrGetter } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableScheduler } from '../_configurable';
import { isClient, isWorker } from '@cyia/ngx-vueuse/shared';
import { signal, computed } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { useIntervalFn } from '@cyia/ngx-vueuse/shared';
import { useEventListener } from '../useEventListener';

export type WebSocketStatus = 'OPEN' | 'CONNECTING' | 'CLOSED';
export type WebSocketHeartbeatMessage = string | ArrayBuffer | Blob;

const DEFAULT_PING_MESSAGE = 'ping';

type MaybeRefOrGetter<T> = SignalOrGetter<T>;

export interface UseWebSocketOptions {
  onConnected?: (ws: WebSocket) => void;
  onDisconnected?: (ws: WebSocket, event: CloseEvent) => void;
  onError?: (ws: WebSocket, event: Event) => void;
  onMessage?: (ws: WebSocket, event: MessageEvent) => void;

  /**
   * Send heartbeat for every x seconds passed
   *
   * @default false
   */
  heartbeat?:
    | boolean
    | (ConfigurableScheduler & {
        /**
         * Message for the heartbeat
         *
         * @default 'ping'
         */
        message?: MaybeRefOrGetter<WebSocketHeartbeatMessage>;

        /**
         * Response message for the heartbeat, if undefined the message will be used
         */
        responseMessage?: MaybeRefOrGetter<WebSocketHeartbeatMessage>;

        /**
         * Interval, in milliseconds
         *
         * @deprecated Please use `scheduler` option instead
         * @default 1000
         */
        interval?: number;

        /**
         * Heartbeat response timeout, in milliseconds
         *
         * @default 1000
         */
        pongTimeout?: number;
      });

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
        retries?: number | ((retried: number) => boolean);

        /**
         * Delay for reconnect, in milliseconds
         *
         * Or you can pass a function to calculate the delay based on the number of retries.
         *
         * @default 1000
         */
        delay?: number | ((retries: number) => number);

        /**
         * On maximum retry time reached.
         */
        onFailed?: Fn;
      };

  /**
   * Immediately open the websocket when calling this composable
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
   * Automatically close a websocket
   *
   * @default true
   */
  autoClose?: boolean;

  /**
   * List of one or more sub-protocol strings
   *
   * @default []
   */
  protocols?: string[];
}

export interface UseWebSocketReturn<T> {
  /**
   * Reference to the latest data received via the websocket,
   * can be watched to respond to incoming messages
   */
  data: Signal<T | null>;

  /**
   * The current websocket status, can be only one of:
   * 'OPEN', 'CONNECTING', 'CLOSED'
   */
  status: Signal<WebSocketStatus>;

  /**
   * Closes the websocket connection gracefully.
   */
  close: WebSocket['close'];

  /**
   * Reopen the websocket connection.
   * If there the current one is active, will close it before opening a new one.
   */
  open: Fn;

  /**
   * Sends data through the websocket connection.
   *
   * @param data
   * @param useBuffer when the socket is not yet open, store the data into the buffer and sent them one connected. Default to true.
   */
  send: (data: string | ArrayBuffer | Blob, useBuffer?: boolean) => boolean;

  /**
   * Reference to the WebSocket instance.
   */
  ws: Signal<WebSocket | undefined>;
}

function resolveNestedOptions<T>(options: T | true): T {
  if (options === true) return {} as T;
  return options;
}

function getDefaultScheduler(
  options: Extract<UseWebSocketOptions['heartbeat'], { interval?: number }>,
) {
  if ('interval' in options) {
    const { interval = 1000 } = options;

    return (cb: AnyFn) => useIntervalFn(cb, interval, { immediate: false });
  }

  return (cb: AnyFn) => useIntervalFn(cb, 1000, { immediate: false });
}

/**
 * Reactive WebSocket client.
 *
 * @see https://vueuse.org/useWebSocket
 * @param url
 */
export function useWebSocket<Data = unknown>(
  url: MaybeRefOrGetter<string | URL | undefined>,
  options: UseWebSocketOptions = {},
): UseWebSocketReturn<Data> {
  const {
    onConnected,
    onDisconnected,
    onError,
    onMessage,
    immediate = true,
    autoConnect = true,
    autoClose = true,
    protocols = [],
  } = options;

  const data = signal<Data | null>(null);
  const status = signal<WebSocketStatus>('CLOSED');
  const wsRef = signal<WebSocket | undefined>(undefined);
  const urlRef = computed(() => toValue(url));

  let heartbeatPause: Fn | undefined;
  let heartbeatResume: Fn | undefined;

  let explicitlyClosed = false;
  let retried = 0;

  let bufferedData: (string | ArrayBuffer | Blob)[] = [];

  let retryTimeout: TimerHandle;
  let pongTimeoutWait: TimerHandle;

  const _sendBuffer = () => {
    if (bufferedData.length && wsRef() && status() === 'OPEN') {
      for (const buffer of bufferedData) wsRef()!.send(buffer);
      bufferedData = [];
    }
  };

  const resetRetry = () => {
    if (retryTimeout != null) {
      clearTimeout(retryTimeout as ReturnType<typeof setTimeout>);
      retryTimeout = undefined;
    }
  };

  const resetHeartbeat = () => {
    clearTimeout(pongTimeoutWait as ReturnType<typeof setTimeout>);
    pongTimeoutWait = undefined;
  };

  // Status code 1000 -> Normal Closure https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
  const close: WebSocket['close'] = (code = 1000, reason) => {
    resetRetry();
    if ((!isClient && !isWorker) || !wsRef()) return;
    explicitlyClosed = true;
    resetHeartbeat();
    heartbeatPause?.();
    wsRef()!.close(code, reason);
    wsRef.set(undefined);
    status.set('CLOSED');
  };

  const send = (data: string | ArrayBuffer | Blob, useBuffer = true) => {
    if (!wsRef() || status() !== 'OPEN') {
      if (useBuffer) bufferedData.push(data);
      return false;
    }
    _sendBuffer();
    wsRef()!.send(data);
    return true;
  };

  const _init = () => {
    if (explicitlyClosed || typeof urlRef() === 'undefined') return;

    const ws = new WebSocket(urlRef()!, protocols);
    wsRef.set(ws);
    status.set('CONNECTING');

    ws.onopen = () => {
      if (wsRef() !== ws) return;

      status.set('OPEN');
      retried = 0;
      onConnected?.(ws!);
      heartbeatResume?.();
      _sendBuffer();
    };

    ws.onclose = (ev) => {
      if (wsRef() === ws) status.set('CLOSED');

      resetHeartbeat();
      heartbeatPause?.();
      onDisconnected?.(ws, ev);

      if (!explicitlyClosed && options.autoReconnect && (wsRef() == null || ws === wsRef())) {
        const {
          retries = -1,
          delay = 1000,
          onFailed,
        } = resolveNestedOptions(options.autoReconnect);

        const checkRetries =
          typeof retries === 'function'
            ? retries
            : () => typeof retries === 'number' && (retries < 0 || retried < retries);

        if (checkRetries(retried)) {
          retried += 1;
          const delayTime = typeof delay === 'function' ? delay(retried) : delay;
          retryTimeout = setTimeout(_init, delayTime);
        } else {
          onFailed?.();
        }
      }
    };

    ws.onerror = (e) => {
      onError?.(ws!, e);
    };

    ws.onmessage = (e: MessageEvent) => {
      if (options.heartbeat) {
        resetHeartbeat();
        const { message = DEFAULT_PING_MESSAGE, responseMessage = message } = resolveNestedOptions(
          options.heartbeat,
        );
        if (e.data === toValue(responseMessage)) return;
      }

      data.set(e.data);
      onMessage?.(ws!, e);
    };
  };

  if (options.heartbeat) {
    const {
      message = DEFAULT_PING_MESSAGE,
      scheduler = getDefaultScheduler(resolveNestedOptions(options.heartbeat)),
      pongTimeout = 1000,
    } = resolveNestedOptions(options.heartbeat);

    const { pause, resume } = scheduler(() => {
      send(toValue(message), false);
      if (pongTimeoutWait != null) return;
      pongTimeoutWait = setTimeout(() => {
        // auto-reconnect will be trigger with ws.onclose()
        close();
        explicitlyClosed = false;
      }, pongTimeout);
    });

    heartbeatPause = pause;
    heartbeatResume = resume;
  }

  if (autoClose) {
    if (isClient) useEventListener('beforeunload', () => close(), { passive: true });
    tryOnScopeDispose(close);
  }

  const open = () => {
    if (!isClient && !isWorker) return;

    close();
    explicitlyClosed = false;
    retried = 0;
    _init();
  };

  if (immediate) open();

  if (autoConnect) {
    watch(urlRef, open);
  }

  return {
    data,
    status,
    close,
    send,
    open,
    ws: wsRef,
  };
}
