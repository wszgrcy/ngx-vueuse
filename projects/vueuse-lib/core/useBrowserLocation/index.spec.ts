import { describe, expect, it, vi } from 'vitest';
import { useBrowserLocation } from './useBrowserLocation';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
function createMockWindow(initialHref = 'http://localhost/') {
  const url = new URL(initialHref);

  const location = {
    hash: url.hash,
    host: url.host,
    hostname: url.hostname,
    href: url.href,
    pathname: url.pathname,
    port: url.port,
    protocol: url.protocol,
    search: url.search,
    origin: url.origin,
  };

  return {
    location,
    history: { state: null, length: 1 },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}
describe('useBrowserLocation', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(useBrowserLocation).toBeDefined();
  });

  it('should read initial location values', () => {
    const mockWindow = createMockWindow('http://localhost/path?q=1#anchor');
    const state = runInInjectionContext(injector, () =>
      useBrowserLocation({ window: mockWindow as any }),
    );

    expect(state().href).toBe('http://localhost/path?q=1#anchor');
    expect(state().pathname).toBe('/path');
    expect(state().search).toBe('?q=1');
    expect(state().hash).toBe('#anchor');
  });
});
