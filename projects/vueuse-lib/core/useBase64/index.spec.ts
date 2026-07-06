import { describe, expect, it, beforeEach } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useBase64 } from './index';

describe('useBase64', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should work with record', async () => {
    const template = { test: 5 };

    const { promise, base64 } = runWithInjector(() => useBase64(template));

    await promise();

    expect(base64()).toMatchInlineSnapshot(`"data:application/json;base64,eyJ0ZXN0Ijo1fQ=="`);
  });

  it('should work with map and default serialize function', async () => {
    const map = new Map([['test', 1]]);

    const { promise, base64 } = runWithInjector(() => useBase64(map));

    await promise();

    expect(base64()).toMatchInlineSnapshot(`"data:application/json;base64,eyJ0ZXN0IjoxfQ=="`);
  });

  it('should work with set', async () => {
    const set = new Set([1]);

    const { promise, base64 } = runWithInjector(() => useBase64(set));

    await promise();

    expect(base64()).toMatchInlineSnapshot(`"data:application/json;base64,WzFd"`);
  });

  it('should work with array', async () => {
    const arr = [1, 2, 3];

    const { promise, base64 } = runWithInjector(() => useBase64(arr));

    await promise();

    expect(base64()).toMatchInlineSnapshot(`"data:application/json;base64,WzEsMiwzXQ=="`);
  });

  it('should work with custom serialize function', async () => {
    const arr = [1, 2, 3];

    const serializer = (arr: number[]) => JSON.stringify(arr.map((el) => el * 2));

    const { promise, base64 } = runWithInjector(() => useBase64(arr, { serializer }));

    await promise();

    expect(base64()).toMatchInlineSnapshot(`"data:application/json;base64,WzIsNCw2XQ=="`);
  });

  it('should work with dataUrl false', async () => {
    const arr = [1, 2, 3];

    const { promise, base64 } = runWithInjector(() => useBase64(arr, { dataUrl: false }));

    await promise();

    expect(base64()).toMatchInlineSnapshot(`"WzEsMiwzXQ=="`);
  });
});
