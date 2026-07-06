import { describe, expect, it, beforeEach, vi, type MockInstance } from 'vitest';
import { computed, signal } from '@angular/core';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';
import { useEventListener } from './index';
import type { Fn } from '@cyia/ngx-vueuse/shared';

describe('useEventListener', () => {
  const options = { capture: true };
  let stop: Fn;
  let target: HTMLDivElement;
  let removeSpy: MockInstance;
  let addSpy: MockInstance;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
    target = document.createElement('div');
    removeSpy = vi.spyOn(target, 'removeEventListener');
    addSpy = vi.spyOn(target, 'addEventListener');
  });

  it('should be defined', () => {
    expect(useEventListener).toBeDefined();
  });

  describe('given none array (single event, single listener)', () => {
    const listener = vi.fn();
    const event = 'click';

    beforeEach(() => {
      listener.mockReset();
      runInInjectionContext(injector, () => {
        stop = useEventListener(target, event, listener, options);
      });
    });

    // Use tick/poll for async effect

    it('should add listener', async () => {
      await waitForMicrotasks();
      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger listener', async () => {
      await waitForMicrotasks();
      expect(listener).not.toHaveBeenCalled();
      target.dispatchEvent(new MouseEvent(event));
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should remove listener', async () => {
      await waitForMicrotasks();
      expect(removeSpy).not.toHaveBeenCalled();

      stop();

      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith(event, listener, options);
    });
  });

  describe('given array of events but single listener', () => {
    const listener = vi.fn();
    const events = ['click', 'scroll', 'blur', 'resize'];

    beforeEach(() => {
      listener.mockReset();
      runInInjectionContext(injector, () => {
        stop = useEventListener(target, events, listener, options);
      });
    });

    it('should add listener for all events', async () => {
      await waitForMicrotasks();
      events.forEach((event) => expect(addSpy).toHaveBeenCalledWith(event, listener, options));
    });

    it('should trigger listener with all events', async () => {
      await waitForMicrotasks();
      expect(listener).not.toHaveBeenCalled();
      events.forEach((event, index) => {
        target.dispatchEvent(new Event(event));
        expect(listener).toHaveBeenCalledTimes(index + 1);
      });
    });

    it('should remove listener with all events', async () => {
      await waitForMicrotasks();
      expect(removeSpy).not.toHaveBeenCalled();

      stop();

      expect(removeSpy).toHaveBeenCalledTimes(events.length);
      events.forEach((event) => expect(removeSpy).toHaveBeenCalledWith(event, listener, options));
    });
  });

  describe('given single event but array of listeners', () => {
    const listeners = [vi.fn(), vi.fn(), vi.fn()];
    const event = 'click';

    beforeEach(() => {
      listeners.forEach((listener) => listener.mockReset());
      runInInjectionContext(injector, () => {
        stop = useEventListener(target, event, listeners, options);
      });
    });

    it('should add all listeners', async () => {
      await waitForMicrotasks();
      listeners.forEach((listener) =>
        expect(addSpy).toHaveBeenCalledWith(event, listener, options),
      );
    });

    it('should call all listeners with single click event', async () => {
      await waitForMicrotasks();
      listeners.forEach((listener) => expect(listener).not.toHaveBeenCalled());
      target.dispatchEvent(new Event(event));

      listeners.forEach((listener) => expect(listener).toHaveBeenCalledTimes(1));
    });

    it('should remove listeners', async () => {
      await waitForMicrotasks();
      expect(removeSpy).not.toHaveBeenCalled();

      stop();

      expect(removeSpy).toHaveBeenCalledTimes(listeners.length);
      listeners.forEach((listener) =>
        expect(removeSpy).toHaveBeenCalledWith(event, listener, options),
      );
    });
  });

  describe('given both array of events and listeners', () => {
    const listeners = [vi.fn(), vi.fn(), vi.fn()];
    const events = ['click', 'scroll', 'blur', 'resize', 'custom-event'];

    beforeEach(() => {
      listeners.forEach((listener) => listener.mockReset());
      runInInjectionContext(injector, () => {
        stop = useEventListener(target, events, listeners, options);
      });
    });

    it('should add all listeners for all events', async () => {
      await waitForMicrotasks();
      listeners.forEach((listener) => {
        events.forEach((event) => {
          expect(addSpy).toHaveBeenCalledWith(event, listener, options);
        });
      });
    });

    it('should call all listeners with all events', async () => {
      await waitForMicrotasks();
      events.forEach((event, index) => {
        target.dispatchEvent(new Event(event));
        listeners.forEach((listener) => expect(listener).toHaveBeenCalledTimes(index + 1));
      });
    });

    it('should remove all listeners with all events', async () => {
      await waitForMicrotasks();
      stop();

      listeners.forEach((listener) => {
        events.forEach((event) => {
          expect(removeSpy).toHaveBeenCalledWith(event, listener, options);
        });
      });
    });
  });

  describe('with signal target', () => {
    it('should listen event with signal target', async () => {
      const listener = vi.fn();

      runInInjectionContext(injector, () => {
        const targetSignal = signal(target);
        stop = useEventListener(targetSignal, 'click', listener);
      });

      await waitForMicrotasks();
      target.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(1);

      stop();
    });

    it('should not listen when signal target is null', async () => {
      const listener = vi.fn();

      runInInjectionContext(injector, () => {
        const nullTarget = signal<HTMLDivElement | null>(null);
        useEventListener(nullTarget, 'click', listener);
      });

      await waitForMicrotasks();
      target.dispatchEvent(new MouseEvent('click'));
      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('with window target', () => {
    it('should listen window event when no target provided', async () => {
      const listener = vi.fn();

      runInInjectionContext(injector, () => {
        stop = useEventListener(window, 'resize', listener);
      });

      await waitForMicrotasks();
      window.dispatchEvent(new Event('resize'));
      expect(listener).toHaveBeenCalledTimes(1);

      stop();
    });
  });

  describe('with invalid signal target', () => {
    it('should not listen when signal target is null', async () => {
      const listener = vi.fn();

      runInInjectionContext(injector, () => {
        const nullTarget = signal<HTMLDivElement | null>(null);
        useEventListener(nullTarget, 'click', listener);
      });

      await waitForMicrotasks();
      target.dispatchEvent(new MouseEvent('click'));
      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('with element listen (no explicit target)', () => {
    it('should use window as default target when no target provided', async () => {
      const listener = vi.fn();

      runInInjectionContext(injector, () => {
        stop = useEventListener('click', listener);
      });

      await waitForMicrotasks();
      window.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(1);

      stop();
    });

    it('should manually stop listening on window event', async () => {
      const listener = vi.fn();

      runInInjectionContext(injector, () => {
        stop = useEventListener('click', listener);
      });

      stop();

      await waitForMicrotasks();
      window.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(0);
    });
  });

  describe('with array ref of DOM elements', () => {
    it('should accept computed array of DOM elements', async () => {
      const listener = vi.fn();
      const el1 = document.createElement('button');
      const el2 = document.createElement('button');

      runInInjectionContext(injector, () => {
        const targets = computed(() => [el1, el2]);
        stop = useEventListener(targets, 'click', listener);
      });

      await waitForMicrotasks();
      el1.dispatchEvent(new Event('click'));
      el2.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should accept getter returning multiple targets', async () => {
      const listener = vi.fn();
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const active = signal(true);

      runInInjectionContext(injector, () => {
        const targets = computed(() => (active() ? [el1, el2] : []));
        stop = useEventListener(targets, 'mousedown', listener);
      });

      await waitForMicrotasks();
      el1.dispatchEvent(new Event('mousedown'));
      el2.dispatchEvent(new Event('mousedown'));
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should accept array of DOM elements + multiple events', async () => {
      const listener = vi.fn();
      const el1 = document.createElement('button');
      const el2 = document.createElement('button');

      runInInjectionContext(injector, () => {
        const targets = computed(() => [el1, el2]);
        stop = useEventListener(targets, ['click', 'mouseenter'], listener);
      });

      await waitForMicrotasks();
      el1.dispatchEvent(new Event('click'));
      el2.dispatchEvent(new Event('click'));
      el1.dispatchEvent(new Event('mouseenter'));
      el2.dispatchEvent(new Event('mouseenter'));
      expect(listener).toHaveBeenCalledTimes(4);
    });

    it('should accept getter returning multiple targets + multiple events', async () => {
      const listener = vi.fn();
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const active = signal(true);

      runInInjectionContext(injector, () => {
        const targets = computed(() => (active() ? [el1, el2] : []));
        stop = useEventListener(targets, ['mousedown', 'click'], listener);
      });

      await waitForMicrotasks();
      el1.dispatchEvent(new Event('mousedown'));
      el2.dispatchEvent(new Event('mousedown'));
      el1.dispatchEvent(new Event('click'));
      el2.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(4);
    });
  });

  describe('react to target changes', () => {
    it('should react to signal target element changes', async () => {
      const listener = vi.fn();
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const targetSignal = signal(el1);

      runInInjectionContext(injector, () => {
        stop = useEventListener(targetSignal, 'click', listener);
      });

      await waitForMicrotasks();
      el1.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(1);

      targetSignal.set(el2);

      await waitForMicrotasks();
      // el1 should no longer trigger the listener (old listener removed)
      el1.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(1);
      // el2 should trigger the new listener
      el2.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('document and shadowRoot support', () => {
    it('should listen on document and shadowRoot', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      runInInjectionContext(injector, () => {
        stop = useEventListener(document, 'click', listener2);
      });

      const element = document.createElement('div');
      const shadowRoot = element.attachShadow({ mode: 'open' });

      runInInjectionContext(injector, () => {
        useEventListener(shadowRoot, 'click', listener1);
      });

      await waitForMicrotasks();
      shadowRoot.dispatchEvent(new Event('click'));
      document.dispatchEvent(new Event('click'));
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple shadowRoots + multiple events', async () => {
      const element1 = document.createElement('div');
      const shadowRoot1 = element1.attachShadow({ mode: 'open' });
      const element2 = document.createElement('div');
      const shadowRoot2 = element2.attachShadow({ mode: 'closed' });

      const listener = vi.fn();

      runInInjectionContext(injector, () => {
        stop = useEventListener(
          [element1, element2, shadowRoot1, shadowRoot2],
          ['click', 'slotchange'],
          listener,
        );
      });

      await waitForMicrotasks();
      shadowRoot1.dispatchEvent(new Event('click'));
      shadowRoot2.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(2);

      element1.dispatchEvent(new Event('click'));
      element2.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(4);

      shadowRoot1.dispatchEvent(new Event('slotchange'));
      shadowRoot2.dispatchEvent(new Event('slotchange'));
      expect(listener).toHaveBeenCalledTimes(6);
    });
  });

  describe('with signal target reactivity', () => {
    it('should react to signal target changes', async () => {
      const listener = vi.fn();
      const el1 = document.createElement('div');
      const el2 = document.createElement('div');
      const targetSignal = signal(el1);

      runInInjectionContext(injector, () => {
        stop = useEventListener(targetSignal, 'click', listener);
      });

      await waitForMicrotasks();
      el1.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(1);

      targetSignal.set(el2);

      await waitForMicrotasks();
      // el1 should no longer trigger the listener (old listener removed)
      el1.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(1);
      // el2 should trigger the new listener
      el2.dispatchEvent(new Event('click'));
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });
});
