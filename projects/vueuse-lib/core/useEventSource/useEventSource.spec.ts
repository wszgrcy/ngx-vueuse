import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useEventSource } from './index';

// Mock EventSource class
class MockEventSource extends EventTarget {
  readyState: number = 0;
  url: string = '';
  withCredentials: boolean = false;
  readonly CONNECTING = 0 as const;
  readonly OPEN = 1 as const;
  readonly CLOSED = 2 as const;

  constructor() {
    super();
    (this as EventSource).addEventListener('error', this.onerror);
    (this as EventSource).addEventListener('message', this.onmessage);
    this.addEventListener('open', this.onopen);
  }

  onerror(_ev: Event) {
    // noop
  }

  onmessage(_ev: MessageEvent) {
    // noop
  }

  onopen(_ev: Event) {
    // noop
  }

  close() {
    this.readyState = this.CLOSED;
  }
}

describe('useEventSource', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.stubGlobal('EventSource', MockEventSource);
    injector = createInjector();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    injector.destroy();
  });

  it('should be defined', () => {
    expect(useEventSource).toBeDefined();
  });

  it('does not connect if no url', () => {
    const result = runInInjectionContext(injector, () => useEventSource(undefined));
    const { status } = result;

    expect(status()).toBe('CONNECTING');
  });

  it('sets event source when URL is defined', () => {
    const result = runInInjectionContext(injector, () => useEventSource('https://localhost'));
    const { eventSource } = result;

    expect(eventSource()).toBeDefined();
    expect(eventSource()).toBeInstanceOf(MockEventSource);
  });

  it('sets status to OPEN on open', () => {
    const result = runInInjectionContext(injector, () => useEventSource('https://localhost'));
    const { status, eventSource } = result;

    eventSource()!.onopen!(new Event('open'));

    expect(status()).toBe('OPEN');
  });

  it('sets status to CLOSED on error', () => {
    const result = runInInjectionContext(injector, () =>
      useEventSource('https://localhost', [], { autoReconnect: false }),
    );
    const { status, eventSource, error } = result;

    const source = eventSource()!;
    const err = new Event('error');

    source.onopen!(new Event('open'));
    source.onerror!(err);

    expect(status()).toBe('CLOSED');
    expect(error()).toBe(err);
  });

  it('sets data on message', () => {
    const result = runInInjectionContext(injector, () => useEventSource('https://localhost'));
    const { data, eventSource, lastEventId } = result;

    const source = eventSource()!;

    source.onmessage!(
      new MessageEvent('message', {
        data: 'bleep',
        lastEventId: '303',
      }),
    );

    expect(data()).toBe('bleep');
    expect(lastEventId()).toBe('303');
  });

  it('can set non-string data', () => {
    const result = runInInjectionContext(injector, () => useEventSource('https://localhost'));
    const { data, eventSource } = result;

    const source = eventSource()!;
    const eventData = { some: { complex: 'data' } };

    source.onmessage!(new MessageEvent('message', { data: eventData }));

    expect(data()).toBe(eventData);
  });

  it('can set data from custom events', () => {
    const result = runInInjectionContext(injector, () =>
      useEventSource('https://localhost', ['custom-event']),
    );
    const { data, eventSource, event } = result;

    const source = eventSource()!;

    source.dispatchEvent(
      new MessageEvent('custom-event', {
        data: 'bloop',
      }),
    );

    expect(event()).toBe('custom-event');
    expect(data()).toBe('bloop');
  });

  it('can manually open()', () => {
    const result = runInInjectionContext(injector, () =>
      useEventSource('https://localhost', [], {
        immediate: false,
      }),
    );
    const { status, eventSource, open } = result;

    open();

    eventSource()!.onopen!(new Event('open'));

    expect(status()).toBe('OPEN');
  });

  it('can manually close()', () => {
    const result = runInInjectionContext(injector, () => useEventSource('https://localhost'));
    const { status, eventSource, close } = result;

    const source = eventSource()!;

    source.onopen!(new Event('open'));

    close();

    expect(status()).toBe('CLOSED');
  });

  it('should apply custom serializer function', () => {
    const deserialize = vi.fn((v?: string) => ({ data: v?.toUpperCase() }));

    const result = runInInjectionContext(injector, () =>
      useEventSource<any>('https://localhost', [], {
        serializer: {
          read: deserialize as (v?: string) => any,
        },
      }),
    );
    const { data, eventSource } = result;

    const source = eventSource()!;
    const testData = 'hello world';

    source.onmessage!(new MessageEvent('message', { data: testData }));

    expect(deserialize).toHaveBeenCalledWith(testData);
    expect(data()).toEqual({ data: 'HELLO WORLD' });
  });

  it('should handle undefined data correctly', () => {
    const deserialize = vi.fn((data: any) => data);
    const result = runInInjectionContext(injector, () =>
      useEventSource('https://localhost', [], {
        serializer: {
          read: deserialize,
        },
      }),
    );
    const { data, eventSource } = result;

    const source = eventSource()!;

    source.onmessage!(new MessageEvent('message', { data: undefined }));

    expect(data()).toBeNull();
  });
});
