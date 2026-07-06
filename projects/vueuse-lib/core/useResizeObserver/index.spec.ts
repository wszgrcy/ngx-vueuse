import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

// Mock ResizeObserver BEFORE importing the module
const mockDisconnect = vi.fn();
const mockObserve = vi.fn();
const mockTakeRecords = vi.fn();

class MockResizeObserver {
  disconnect = mockDisconnect;
  observe = mockObserve;
  takeRecords = mockTakeRecords;
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

import { useResizeObserver } from './index';

describe('useResizeObserver', () => {
  let callback: globalThis.ResizeObserverCallback;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    callback = vi.fn() as unknown as globalThis.ResizeObserverCallback;
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useResizeObserver).toBeDefined();
  });

  it('should create a ResizeObserver when given an element', async () => {
    const element = { tagName: 'DIV' } as HTMLElement;
    const result = runInInjectionContext(injector, () => useResizeObserver(element, callback));

    expect(result).toBeDefined();
    expect(result.stop).toBeDefined();
  });

  it('should observe multiple elements', async () => {
    const element1 = { tagName: 'DIV1' } as HTMLElement;
    const element2 = { tagName: 'DIV2' } as HTMLElement;
    const result = runInInjectionContext(injector, () =>
      useResizeObserver([element1, element2], callback),
    );

    expect(result).toBeDefined();
  });

  it('should provide a stop method that can be called', async () => {
    const element = { tagName: 'DIV' } as HTMLElement;
    const result = runInInjectionContext(injector, () => useResizeObserver(element, callback));

    // Should not throw
    result.stop();
  });
});
