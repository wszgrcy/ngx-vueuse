import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import { useEventListener } from '../useEventListener';
import { onLongPress } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

describe('onLongPress', () => {
  let element: HTMLElement;
  let elementSignal: Signal<HTMLElement>;
  let parentElement: HTMLElement;
  let childElement: HTMLElement;
  let pointerdownEvent: PointerEvent;
  let pointerUpEvent: PointerEvent;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
    vi.useFakeTimers();
    element = document.createElement('div');
    parentElement = document.createElement('div');
    childElement = document.createElement('div');
    parentElement.appendChild(element);
    element.appendChild(childElement);

    elementSignal = signal(element);

    pointerdownEvent = new PointerEvent('pointerdown', { cancelable: true, bubbles: true });
    pointerUpEvent = new PointerEvent('pointerup', { cancelable: true, bubbles: true });
  });

  afterEach(() => {
    injector.destroy();
    vi.useRealTimers();
  });

  async function triggerCallback(useSignal: boolean) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    runInInjectionContext(injector, () => {
      onLongPress(useSignal ? elementSignal : element, onLongPressCallback);
    });
    element.dispatchEvent(pointerdownEvent);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
  }

  async function triggerCallbackWithDelay(
    useSignal: boolean,
    delayFunc?: (ev: PointerEvent) => number,
  ) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    runInInjectionContext(injector, () => {
      onLongPress(useSignal ? elementSignal : element, onLongPressCallback, {
        delay: delayFunc ?? 1000,
      });
    });
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
    element.dispatchEvent(pointerUpEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(delayFunc ? delayFunc(pointerdownEvent) : 1000);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
  }

  async function notTriggerCallbackOnChildLongPress(useSignal: boolean) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    runInInjectionContext(injector, () => {
      onLongPress(useSignal ? elementSignal : element, onLongPressCallback, {
        modifiers: { self: true },
      });
    });
    childElement.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
  }

  async function workOnceAndPreventModifiers(useSignal: boolean) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    runInInjectionContext(injector, () => {
      onLongPress(useSignal ? elementSignal : element, onLongPressCallback, {
        modifiers: { once: true, prevent: true },
      });
    });
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
    expect(pointerdownEvent.defaultPrevented).toBe(true);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
  }

  async function stopPropagation(useSignal: boolean) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    const onParentLongPressCallback = vi.fn();
    runInInjectionContext(injector, () => {
      useEventListener(signal(parentElement), 'pointerdown', onParentLongPressCallback);
      onLongPress(useSignal ? elementSignal : element, onLongPressCallback, {
        modifiers: { stop: true },
      });
    });
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
    expect(onParentLongPressCallback).toHaveBeenCalledTimes(0);
  }

  async function stopEventListeners(useSignal: boolean) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    let stop = () => {};
    runInInjectionContext(injector, () => {
      stop = onLongPress(useSignal ? elementSignal : element, onLongPressCallback, {
        modifiers: { stop: true },
      });
    });
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
    stop();
    onLongPressCallback.mockClear();
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
  }

  async function triggerCallbackWithThreshold(useSignal: boolean) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    pointerdownEvent = new PointerEvent('pointerdown', {
      cancelable: true,
      bubbles: true,
      clientX: 20,
      clientY: 20,
    });
    const moveWithinThresholdEvent = new PointerEvent('pointermove', {
      cancelable: true,
      bubbles: true,
      clientX: 17,
      clientY: 25,
    });
    const moveOutsideThresholdEvent = new PointerEvent('pointermove', {
      cancelable: true,
      bubbles: true,
      clientX: 4,
      clientY: 30,
    });
    runInInjectionContext(injector, () => {
      onLongPress(useSignal ? elementSignal : element, onLongPressCallback, {
        distanceThreshold: 15,
        delay: 1000,
      });
    });
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    element.dispatchEvent(moveOutsideThresholdEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
    element.dispatchEvent(pointerUpEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    element.dispatchEvent(moveWithinThresholdEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
  }

  async function triggerOnMouseUp(useSignal: boolean) {
    vi.useFakeTimers();
    const onLongPressCallback = vi.fn();
    const onMouseUpCallback = vi.fn();
    runInInjectionContext(injector, () => {
      onLongPress(useSignal ? elementSignal : element, onLongPressCallback, {
        onMouseUp: onMouseUpCallback,
      });
    });
    pointerdownEvent = new PointerEvent('pointerdown', { cancelable: true, bubbles: true });
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(250);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
    expect(onMouseUpCallback).toHaveBeenCalledTimes(0);
    pointerUpEvent = new PointerEvent('pointerup', { cancelable: true, bubbles: true });
    element.dispatchEvent(pointerUpEvent);
    expect(onMouseUpCallback).toHaveBeenCalledTimes(1);
    expect(onMouseUpCallback).toBeCalledWith(
      expect.any(Number),
      0,
      false,
      expect.any(PointerEvent),
    );
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(0);
    pointerdownEvent = new PointerEvent('pointerdown', { cancelable: true, bubbles: true });
    element.dispatchEvent(pointerdownEvent);
    await vi.advanceTimersByTimeAsync(500);
    expect(onLongPressCallback).toHaveBeenCalledTimes(1);
    expect(onMouseUpCallback).toHaveBeenCalledTimes(1);
    pointerUpEvent = new PointerEvent('pointerup', { cancelable: true, bubbles: true });
    element.dispatchEvent(pointerUpEvent);
    expect(onMouseUpCallback).toHaveBeenCalledTimes(2);
    expect(onMouseUpCallback).toBeCalledWith(expect.any(Number), 0, true, expect.any(PointerEvent));
  }

  function suites(useSignal: boolean) {
    describe('given no options', () => {
      it('should trigger longpress after 500ms', () => triggerCallback(useSignal));
    });

    describe('given options', () => {
      it('should trigger longpress after options.delay ms', () =>
        triggerCallbackWithDelay(useSignal));
      it('should not trigger longpress when child element on longpress', () =>
        notTriggerCallbackOnChildLongPress(useSignal));
      it('should work with once and prevent modifiers', () =>
        workOnceAndPreventModifiers(useSignal));
      it('should stop propagation', () => stopPropagation(useSignal));
      it('should remove event listeners after being stopped', () => stopEventListeners(useSignal));
      it('should trigger longpress if pointer is moved', () =>
        triggerCallbackWithThreshold(useSignal));
      it('should trigger onMouseUp when pointer is released', () => triggerOnMouseUp(useSignal));
      it('should trigger longpress after options.delay ms when options.delay is a function', () =>
        triggerCallbackWithDelay(useSignal, () => 2000));
    });
  }

  it('should be defined', () => {
    expect(onLongPress).toBeDefined();
  });

  describe('given argument is signal', () => suites(true));
  describe('given argument is no signal', () => suites(false));
});
