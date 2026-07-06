import { describe, expect, it, vi, beforeEach } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useScriptTag } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('useScriptTag', () => {
  const src = 'https://code.jquery.com/jquery-3.5.1.min.js';

  const scriptTagElement = (): HTMLScriptElement | null =>
    document.head.querySelector(`script[src="${src}"]`);

  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = '';
    injector = createInjector();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should add script tag', async () => {
    const appendChildListener = vi.spyOn(document.head, 'appendChild');

    expect(appendChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    runWithInjector(() => useScriptTag(src, () => {}, { immediate: true }));
    await waitForMicrotasks();
    expect(appendChildListener).toBeCalled();

    expect(scriptTagElement()).toBeInstanceOf(HTMLScriptElement);
  });

  it('should support custom attributes', async () => {
    const appendChildListener = vi.spyOn(document.head, 'appendChild');

    expect(appendChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    runWithInjector(() =>
      useScriptTag(src, () => {}, {
        attrs: { id: 'id-value', 'data-test': 'data-test-value' },
        immediate: true,
      }),
    );
    await waitForMicrotasks();

    expect(appendChildListener).toBeCalled();

    const element = scriptTagElement();
    expect(element).toBeInstanceOf(HTMLScriptElement);
    expect(element?.getAttribute('id')).toBe('id-value');
    expect(element?.getAttribute('data-test')).toBe('data-test-value');
  });

  it('should remove script tag on unload call', async () => {
    const removeChildListener = vi.spyOn(document.head, 'removeChild');

    expect(removeChildListener).not.toBeCalled();

    expect(scriptTagElement()).toBeNull();

    const result = runWithInjector(() => useScriptTag(src, () => {}, { immediate: false }));
    await waitForMicrotasks();

    await result.load(false);

    expect(scriptTagElement()).toBeInstanceOf(HTMLScriptElement);

    await result.unload();

    expect(scriptTagElement()).toBeNull();

    expect(removeChildListener).toBeCalled();

    expect(result.scriptTag()).toBeNull();
  });

  it('should support manual mode', () => {
    const result = runWithInjector(() =>
      useScriptTag(src, () => {}, { immediate: false, manual: true }),
    );

    expect(result.scriptTag()).toBeNull();
  });
});
