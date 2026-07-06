import { describe, expect, it, beforeEach } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useMediaQuery } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('useMediaQuery', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should be defined', () => {
    expect(useMediaQuery).toBeDefined();
  });

  it('should be false without window', () => {
    const result = runWithInjector(() =>
      useMediaQuery('(min-width: 0px)', { window: null as unknown as Window }),
    );
    expect(result()).toBe(false);
  });

  it('should support ssr media queries', async () => {
    const query = signal('(min-width: 500px)');
    const mediaQuery = runWithInjector(() =>
      useMediaQuery(query, { window: null as unknown as Window, ssrWidth: 500 }),
    );
    expect(mediaQuery()).toBe(true);
    query.set('(min-width: 501px)');
    await waitForMicrotasks();
    expect(mediaQuery()).toBe(false);

    query.set('(min-width: 500px) and (max-width: 37rem)');
    await waitForMicrotasks();
    expect(mediaQuery()).toBe(true);

    query.set('(max-width: 31rem)');
    await waitForMicrotasks();
    expect(mediaQuery()).toBe(false);

    query.set('(max-width: 31rem), (min-width: 400px)');
    await waitForMicrotasks();
    expect(mediaQuery()).toBe(true);

    query.set('(max-width: 31rem), not all and (min-width: 400px)');
    await waitForMicrotasks();
    expect(mediaQuery()).toBe(false);

    query.set('not all (min-width: 400px) and (max-width: 600px)');
    await waitForMicrotasks();
    expect(mediaQuery()).toBe(false);

    query.set('not all (max-width: 100px) and (min-width: 1000px)');
    await waitForMicrotasks();
    expect(mediaQuery()).toBe(true);
  });
});
