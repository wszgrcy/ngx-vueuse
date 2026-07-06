import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useMutationObserver } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

let injector: ReturnType<typeof createInjector>;

describe('useMutationObserver', () => {
  beforeEach(() => {
    injector = createInjector();
  });

  afterEach(() => {
    injector.destroy();
  });

  it('should be defined', () => {
    expect(useMutationObserver).toBeDefined();
  });

  it('should work with attributes', async () => {
    const target = document.createElement('div');
    const cb = vi.fn();
    target.setAttribute('id', 'header');
    runInInjectionContext(injector, () => {
      useMutationObserver(target, cb, {
        attributes: true,
      });
    });
    await waitForMicrotasks();
    target.setAttribute('id', 'footer');
    await waitForMicrotasks();
    expect(cb).toHaveBeenCalledTimes(1);
    target.setAttribute('id', 'header');
    await waitForMicrotasks();
    expect(cb).toHaveBeenCalledTimes(2);
    const record = cb.mock.calls[0][0][0];
    // Check that the record has MutationRecord properties (jsdom may not have global MutationRecord)
    expect(record).toHaveProperty('target', target);
    expect(record).toHaveProperty('type', 'attributes');
    expect(record).toHaveProperty('attributeName', 'id');
  });

  it('should work with childList', async () => {
    const target = document.createElement('div');
    const cb = vi.fn();
    runInInjectionContext(injector, () => {
      useMutationObserver(target, cb, {
        childList: true,
      });
    });
    await waitForMicrotasks();

    target.appendChild(document.createElement('div'));
    await waitForMicrotasks();
    expect(cb).toHaveBeenCalled();
  });

  it('should work with stop', async () => {
    const target = document.createElement('div');
    const cb = vi.fn();
    const { stop } = runInInjectionContext(injector, () =>
      useMutationObserver(target, cb, {
        attributes: true,
      }),
    );
    await waitForMicrotasks();
    target.setAttribute('id', 'footer');
    await waitForMicrotasks();
    expect(cb).toHaveBeenCalled();
    stop();
    target.setAttribute('id', 'header');
    await waitForMicrotasks();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
