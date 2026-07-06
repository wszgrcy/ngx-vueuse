import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useWebWorker } from './index';
// 默认测试环境无法测试
describe.skip('useWebWorker', () => {
  let injector = createInjector();
  let originalWorker: typeof Worker | undefined;

  beforeEach(() => {
    injector = createInjector();
    originalWorker = globalThis.Worker;
  });

  afterEach(() => {
    if (originalWorker !== undefined) {
      globalThis.Worker = originalWorker;
    }
  });

  it('should return an object with data, post, terminate, worker', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      expect(result.data).toBeDefined();
      expect(result.post).toBeDefined();
      expect(result.terminate).toBeDefined();
      expect(result.worker).toBeDefined();
    });
  });

  it('should return data as null initially', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      expect(result.data()).toBeNull();
    });
  });

  it('should return worker as undefined initially', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      expect(result.worker()).toBeUndefined();
    });
  });

  it('should return post as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      expect(typeof result.post).toBe('function');
    });
  });

  it('should return terminate as a function', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      expect(typeof result.terminate).toBe('function');
    });
  });

  it('should handle custom window option', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      expect(result.worker()).toBeUndefined();
    });
  });

  it('should return undefined when post is called without worker', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      const mockTransfer = [{} as Blob];
      expect(() => result.post('test', mockTransfer)).not.toThrow();
    });
  });

  it('should return undefined when terminate is called without worker', () => {
    runInInjectionContext(injector, () => {
      const result = useWebWorker({ window: undefined } as any);

      expect(() => result.terminate()).not.toThrow();
    });
  });

  it('should handle string URL with custom window', () => {
    runInInjectionContext(injector, () => {
      const mockWorker = {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null as ((e: MessageEvent) => void) | null,
      } as unknown as Worker;

      class MockWorker {
        postMessage = vi.fn();
        terminate = vi.fn();
        onmessage: ((e: MessageEvent) => void) | null = null;
        constructor() {
          Object.assign(this, mockWorker);
        }
      }

      globalThis.Worker = MockWorker as unknown as typeof Worker;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebWorker('test-worker.js', {}, { window: mockWindow });

      expect(result.worker()).toBeDefined();
    });
  });

  it('should handle WorkerFn with custom window', () => {
    runInInjectionContext(injector, () => {
      const mockWorker = {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null as ((e: MessageEvent) => void) | null,
      } as unknown as Worker;

      const workerFn = () => mockWorker;
      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebWorker(workerFn as any, undefined, { window: mockWindow });

      expect(result.worker()).toBe(mockWorker);
    });
  });

  it('should handle existing Worker instance with custom window', () => {
    runInInjectionContext(injector, () => {
      const mockWorker = {
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null as ((e: MessageEvent) => void) | null,
      } as unknown as Worker;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebWorker(mockWorker as any, undefined, { window: mockWindow });

      expect(result.worker()).toBe(mockWorker);
    });
  });

  it('should set data when worker receives a message', () => {
    runInInjectionContext(injector, () => {
      let messageHandler: ((e: MessageEvent) => void) | null = null;

      class MockWorker {
        postMessage = vi.fn();
        terminate = vi.fn();
        get onmessage() {
          return messageHandler;
        }
        set onmessage(fn: ((e: MessageEvent) => void) | null) {
          messageHandler = fn;
        }
      }

      globalThis.Worker = MockWorker as unknown as typeof Worker;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebWorker('test-worker.js', {}, { window: mockWindow });

      expect(result.data()).toBeNull();

      if (messageHandler) {
        (messageHandler as any)({ data: 'test-data' } as MessageEvent);
        expect(result.data()).toBe('test-data');
      }
    });
  });

  it('should call postMessage on worker when post is called', () => {
    runInInjectionContext(injector, () => {
      const mockPostMessage = vi.fn();
      const mockTerminate = vi.fn();

      class MockWorker {
        postMessage = mockPostMessage;
        terminate = mockTerminate;
        onmessage: ((e: MessageEvent) => void) | null = null;
      }

      globalThis.Worker = MockWorker as unknown as typeof Worker;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebWorker('test-worker.js', {}, { window: mockWindow });

      const mockTransfer = [{} as Blob];
      result.post('hello', mockTransfer);

      expect(mockPostMessage).toHaveBeenCalledWith('hello', mockTransfer);
    });
  });

  it('should call terminate on worker when terminate is called', () => {
    runInInjectionContext(injector, () => {
      const mockPostMessage = vi.fn();
      const mockTerminate = vi.fn();

      class MockWorker {
        postMessage = mockPostMessage;
        terminate = mockTerminate;
        onmessage: ((e: MessageEvent) => void) | null = null;
      }

      globalThis.Worker = MockWorker as unknown as typeof Worker;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebWorker('test-worker.js', {}, { window: mockWindow });

      result.terminate();

      expect(mockTerminate).toHaveBeenCalled();
    });
  });

  it('should handle WorkerOptions when creating worker from URL', () => {
    runInInjectionContext(injector, () => {
      class MockWorker {
        postMessage = vi.fn();
        terminate = vi.fn();
        onmessage: ((e: MessageEvent) => void) | null = null;
      }

      const workerOptions = { type: 'module' as WorkerType };
      globalThis.Worker = MockWorker as unknown as typeof Worker;

      const mockWindow = {
        document: {} as Document,
      } as unknown as Window;

      const result = useWebWorker('test-worker.js', workerOptions, { window: mockWindow });

      expect(result.worker()).toBeDefined();
    });
  });
});
