import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';
import { onElementRemoval } from './index';

describe('onElementRemoval', () => {
  let injector: ReturnType<typeof createInjector>;
  let grandElement: HTMLElement;
  let parentElement: HTMLElement;
  let targetElement: HTMLElement;

  beforeEach(() => {
    injector = createInjector();
    grandElement = document.createElement('div');
    parentElement = document.createElement('div');
    targetElement = document.createElement('div');

    parentElement.appendChild(targetElement);
    grandElement.appendChild(parentElement);
    document.body.appendChild(grandElement);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should be defined', () => {
    expect(onElementRemoval).toBeDefined();
  });

  it('should be called when the element is removed', async () => {
    const callback = vi.fn();
    let stop: ReturnType<typeof onElementRemoval> | undefined;

    runInInjectionContext(injector, () => {
      stop = onElementRemoval(targetElement, callback);
    });

    parentElement.removeChild(targetElement);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);

    parentElement.appendChild(targetElement);
    parentElement.removeChild(targetElement);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(2);

    parentElement.appendChild(targetElement);
    parentElement.innerHTML = '';
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(3);

    stop?.();
  });

  it('should be called when any element containing the target element is removed', async () => {
    const callback = vi.fn();
    runInInjectionContext(injector, () => {
      onElementRemoval(targetElement, callback);
    });

    grandElement.removeChild(parentElement);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);

    grandElement.appendChild(parentElement);
    grandElement.remove();
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(2);

    document.body.appendChild(grandElement);
    document.body.removeChild(grandElement);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should correctly triggered when use the custom document', async () => {
    const callback = vi.fn();
    const shadowRoot = grandElement.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(parentElement);

    runInInjectionContext(injector, () => {
      onElementRemoval(targetElement, callback, { document: shadowRoot as any });
    });

    parentElement.removeChild(targetElement);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(1);

    parentElement.appendChild(targetElement);
    parentElement.removeChild(targetElement);
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(2);

    parentElement.appendChild(targetElement);
    parentElement.innerHTML = '';
    await waitForMicrotasks();
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should correctly triggered even if the element is assigned a value after initialization', async () => {
    const callback = vi.fn();
    let stop: ReturnType<typeof onElementRemoval> | undefined;

    // Create element first
    const el = document.createElement('div');

    runInInjectionContext(injector, () => {
      const targetElement2 = signal<HTMLElement | null>(el);
      stop = onElementRemoval(targetElement2 as any, callback);
    });

    parentElement.appendChild(el);
    await waitForMicrotasks();

    parentElement.removeChild(el);
    await waitForMicrotasks();
    // Callback should be called when element is removed
    expect(callback).toHaveBeenCalledTimes(1);

    stop?.();
  });

  it('should stop observing after called the stop handle', () => {
    const callback = vi.fn();
    runInInjectionContext(injector, () => {
      const stop = onElementRemoval(targetElement, callback);
      stop();

      parentElement.removeChild(targetElement);
      // Effects are cleaned up, so callback should not be called
      expect(callback).toHaveBeenCalledTimes(0);
    });
  });
});
