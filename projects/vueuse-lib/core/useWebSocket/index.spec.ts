import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useWebSocket } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('useWebSocket', () => {
  const mockWebSocket = vi.fn<(host: string) => WebSocket>();
  let injector: ReturnType<typeof createInjector>;

  mockWebSocket.prototype.send = vi.fn();
  mockWebSocket.prototype.close = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('WebSocket', mockWebSocket);
    vi.useFakeTimers();
    injector = createInjector();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should be defined', () => {
    expect(useWebSocket).toBeDefined();
  });

  it('should initialise web socket', () => {
    const ref = runWithInjector(() => useWebSocket('ws://localhost'));

    expect(ref.data()).toBe(null);
    expect(ref.status()).toBe('CONNECTING');
    expect(mockWebSocket).toBeCalledWith('ws://localhost', []);
    expect(ref.close).toBeDefined();
    expect(ref.send).toBeDefined();
    expect(ref.open).toBeDefined();
    expect(ref.ws()).toBeDefined();
  });

  it('should reconnect if URL changes', async () => {
    const url = signal('ws://localhost');
    const ref = runInInjectionContext(injector, () => useWebSocket(url));

    url.set('ws://127.0.0.1');
    vi.setTimerTickMode('nextTimerAsync');
    await waitForMicrotasks();

    expect(mockWebSocket.prototype.close).toBeCalledWith(1000, undefined);
    expect(mockWebSocket).toBeCalledWith('ws://127.0.0.1', []);
    expect(ref.status()).toBe('CONNECTING');
  });

  it('should not reconnect on URL change if immediate and autoConnect are false', async () => {
    const url = signal('ws://localhost');
    const ref = runWithInjector(() =>
      useWebSocket(url, {
        immediate: false,
        autoConnect: false,
      }),
    );

    url.set('ws://127.0.0.1');
    await Promise.resolve();

    expect(mockWebSocket.prototype.close).not.toHaveBeenCalled();
    expect(mockWebSocket).not.toHaveBeenCalledWith('ws://127.0.0.1', []);
    expect(ref.status()).toBe('CLOSED');
  });

  it('should remain closed if immediate is false', () => {
    const ref = runWithInjector(() =>
      useWebSocket('ws://localhost', {
        immediate: false,
      }),
    );

    expect(ref.status()).toBe('CLOSED');
  });

  describe('open', () => {
    it('should reconnect if called while still open', () => {
      const ref = runWithInjector(() => useWebSocket('ws://localhost'));

      expect(ref.status()).toBe('CONNECTING');
      expect(mockWebSocket).toHaveBeenCalledTimes(1);

      ref.open();

      expect(ref.status()).toBe('CONNECTING');
      expect(mockWebSocket).toHaveBeenCalledTimes(2);
    });

    it('should open socket', () => {
      const ref = runWithInjector(() =>
        useWebSocket('ws://localhost', {
          immediate: false,
        }),
      );

      expect(ref.status()).toBe('CLOSED');
      expect(mockWebSocket).not.toHaveBeenCalled();

      ref.open();

      expect(ref.status()).toBe('CONNECTING');
      expect(mockWebSocket).toBeCalledWith('ws://localhost', []);
    });
  });

  describe('close', () => {
    it('should close socket', () => {
      const ref = runWithInjector(() => useWebSocket('ws://localhost'));

      expect(ref.status()).toBe('CONNECTING');

      ref.close();

      expect(mockWebSocket.prototype.close).toBeCalledWith(1000, undefined);
    });

    it('should sync status to CLOSED after close() when onclose fires', async () => {
      vi.setTimerTickMode('nextTimerAsync');

      const ref = runWithInjector(() => useWebSocket('ws://localhost'));
      await waitForMicrotasks();

      const ws = ref.ws();
      ws?.onopen?.(new Event('open'));
      expect(ref.status()).toBe('OPEN');

      ref.close();

      // Real browsers fire onclose asynchronously after WebSocket.close().
      // Simulate that here: at this point close() has already nulled wsRef.value,
      // so the handler must still transition status to CLOSED.

      ws?.onclose?.(new CloseEvent('close'));
      await waitForMicrotasks();
      expect(ref.status()).toBe('CLOSED');
    });
  });

  describe('autoClose', () => {
    it('should close on unload if true', () => {
      const ref = runWithInjector(() =>
        useWebSocket('ws://localhost', {
          autoClose: true,
        }),
      );

      window.dispatchEvent(new Event('beforeunload'));

      expect(mockWebSocket.prototype.close).toHaveBeenCalled();
    });

    it.skip('should close when scope disposed if true');

    it('should not close on unload if false', () => {
      const ref = runWithInjector(() =>
        useWebSocket('ws://localhost', {
          autoClose: false,
        }),
      );

      window.dispatchEvent(new Event('beforeunload'));

      expect(mockWebSocket.prototype.close).not.toHaveBeenCalled();
    });
  });

  it('should set data on message', () => {
    const ref = runWithInjector(() => useWebSocket('ws://localhost'));

    ref.ws()?.onopen?.(new Event('open'));

    const ev = new MessageEvent('message', {
      data: 'bleep bloop',
    });

    ref.ws()?.onmessage?.(ev);

    expect(ref.data()).toBe('bleep bloop');
  });

  it('should call onMessage on message', () => {
    const onMessage = vi.fn();

    const ref = runWithInjector(() => useWebSocket('ws://localhost', { onMessage }));

    ref.ws()?.onopen?.(new Event('open'));

    const ev = new MessageEvent('message', {
      data: 'bleep bloop',
    });

    ref.ws()?.onmessage?.(ev);

    expect(onMessage).toBeCalledWith(ref.ws(), ev);
  });

  it('should call onError on error', () => {
    const onError = vi.fn();

    const ref = runWithInjector(() => useWebSocket('ws://localhost', { onError }));

    ref.ws()?.onopen?.(new Event('open'));

    const ev = new Event('error');

    ref.ws()?.onerror?.(ev);

    expect(onError).toBeCalledWith(ref.ws(), ev);
  });

  it('should call onDisconnected on close', () => {
    const onDisconnected = vi.fn();

    const ref = runWithInjector(() => useWebSocket('ws://localhost', { onDisconnected }));

    ref.ws()?.onopen?.(new Event('open'));

    const ev = new CloseEvent('close');

    ref.ws()?.onclose?.(ev);

    expect(onDisconnected).toBeCalledWith(ref.ws(), ev);
  });

  it('should be CLOSED on close', () => {
    const ref = runWithInjector(() => useWebSocket('ws://localhost'));

    ref.ws()?.onopen?.(new Event('open'));

    expect(ref.status()).toBe('OPEN');

    ref.ws()?.onclose?.(new CloseEvent('close'));

    expect(ref.status()).toBe('CLOSED');
  });

  it('should be OPEN on open', () => {
    const ref = runWithInjector(() => useWebSocket('ws://localhost'));

    ref.ws()?.onopen?.(new Event('open'));

    expect(ref.status()).toBe('OPEN');
  });

  it('should call onConnected on open', () => {
    const onConnected = vi.fn();

    const ref = runWithInjector(() => useWebSocket('ws://localhost', { onConnected }));

    ref.ws()?.onopen?.(new Event('open'));

    expect(onConnected).toBeCalledWith(ref.ws());
  });

  describe('send', () => {
    it('should buffer data until connect if buffer=true', () => {
      const ref = runWithInjector(() => useWebSocket('ws://localhost'));

      ref.send('bleep bloop', true);

      ref.ws()?.onopen?.(new Event('open'));

      expect(mockWebSocket.prototype.send).toBeCalledWith('bleep bloop');
    });

    it('should send data', () => {
      const ref = runWithInjector(() => useWebSocket('ws://localhost'));

      ref.ws()?.onopen?.(new Event('open'));

      ref.send('bleep bloop');

      expect(mockWebSocket.prototype.send).toBeCalledWith('bleep bloop');
    });
  });

  describe('heartbeat', () => {
    it('should send a heartbeat if heartbeat=true', async () => {
      vi.setTimerTickMode('nextTimerAsync');

      const ref = runWithInjector(() =>
        useWebSocket('wss://server.example.com', {
          heartbeat: {
            interval: 500,
          },
        }),
      );
      await waitForMicrotasks();

      ref.ws()?.onopen?.(new Event('open'));
      await vi.advanceTimersByTimeAsync(500);

      expect(mockWebSocket.prototype.send).toBeCalledWith('ping');
    });

    it('should not send a heartbeat if heartbeat=false', async () => {
      vi.setTimerTickMode('nextTimerAsync');

      const ref = runWithInjector(() =>
        useWebSocket('wss://server.example.com', {
          heartbeat: false,
        }),
      );
      await waitForMicrotasks();

      ref.ws()?.onopen?.(new Event('open'));
      await vi.advanceTimersByTimeAsync(500);
      expect(mockWebSocket.prototype.send).not.toHaveBeenCalled();
    });

    it('should call close on pongTimeout', async () => {
      vi.setTimerTickMode('nextTimerAsync');

      const ref = runWithInjector(() =>
        useWebSocket('wss://server.example.com', {
          heartbeat: {
            interval: 500,
            pongTimeout: 1000,
          },
        }),
      );
      await waitForMicrotasks();

      ref.ws()?.onopen?.(new Event('open'));
      expect(ref.status()).toBe('OPEN');
      mockWebSocket.prototype.close.mockClear();
      await vi.advanceTimersByTimeAsync(1499);
      expect(mockWebSocket.prototype.close).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(mockWebSocket.prototype.close).toHaveBeenCalledOnce();
    });

    it('should not call close on pongTimeout if connection already closed', async () => {
      vi.setTimerTickMode('nextTimerAsync');

      const ref = runWithInjector(() =>
        useWebSocket('wss://server.example.com', {
          heartbeat: {
            message: 'ping',
            interval: 500,
            pongTimeout: 1000,
          },
        }),
      );
      await waitForMicrotasks();

      ref.ws()?.onopen?.(new Event('open'));
      expect(ref.status()).toBe('OPEN');
      const ev = new CloseEvent('close');
      ref.ws()?.onclose?.(ev);
      expect(ref.status()).toBe('CLOSED');
      mockWebSocket.prototype.close.mockClear();
      await vi.advanceTimersByTimeAsync(1500);
      expect(mockWebSocket.prototype.close).not.toHaveBeenCalled();
    });

    it('should not send a heartbeat if the connection is closed', async () => {
      vi.setTimerTickMode('nextTimerAsync');

      const messageSpy = vi.fn(() => 'ping');
      const ref = runWithInjector(() =>
        useWebSocket('wss://server.example.com', {
          heartbeat: {
            message: messageSpy,
            interval: 500,
            pongTimeout: 1000,
          },
        }),
      );
      await waitForMicrotasks();

      expect(ref.status()).toBe('CONNECTING');
      ref.ws()?.onopen?.(new Event('open'));
      expect(ref.status()).toBe('OPEN');
      await vi.advanceTimersByTimeAsync(500);
      expect(messageSpy).toHaveBeenCalledTimes(1);
      ref.ws()?.onclose?.(new CloseEvent('close'));
      expect(ref.status()).toBe('CLOSED');
      await vi.advanceTimersByTimeAsync(2500);
      expect(messageSpy).toHaveBeenCalledTimes(1);
    });
  });
});
