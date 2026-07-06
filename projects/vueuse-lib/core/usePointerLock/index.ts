import type { Signal } from '@angular/core';
import type { ConfigurableDocument } from '../_configurable';
import type { Supportable } from '../types';
import type { MaybeElement, MaybeElementRef } from '../unrefElement';
import { signal } from '@angular/core';
import { defaultDocument } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

export interface UsePointerLockOptions extends ConfigurableDocument {
  // pointerLockOptions?: PointerLockOptions
}

export interface UsePointerLockReturn extends Supportable {
  element: Signal<MaybeElement>;
  triggerElement: Signal<MaybeElement>;
  lock: (e: MaybeElementRef | Event) => Promise<MaybeElement>;
  unlock: () => Promise<boolean>;
}

/**
 * Reactive pointer lock.
 *
 * @see https://vueuse.org/usePointerLock
 * @param target
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePointerLock(
  target?: MaybeElementRef,
  options: UsePointerLockOptions = {},
): UsePointerLockReturn {
  const { document = defaultDocument } = options;

  const isSupported = useSupported(() => document && 'pointerLockElement' in document);

  const element = signal<MaybeElement | undefined>(undefined);

  const triggerElement = signal<MaybeElement | undefined>(undefined);

  let targetElement: MaybeElement;

  if (isSupported()) {
    const listenerOptions = { passive: true };

    useEventListener(
      document,
      'pointerlockchange',
      () => {
        const currentElement = document!.pointerLockElement ?? element();
        if (targetElement && currentElement === targetElement) {
          element.set(document!.pointerLockElement as MaybeElement);
          if (!element()) {
            triggerElement.set(null);
            targetElement = null;
          }
        }
      },
      listenerOptions,
    );

    useEventListener(
      document,
      'pointerlockerror',
      () => {
        const currentElement = document!.pointerLockElement ?? element();
        if (targetElement && currentElement === targetElement) {
          const action = document!.pointerLockElement ? 'release' : 'acquire';
          throw new Error(`Failed to ${action} pointer lock.`);
        }
      },
      listenerOptions,
    );
  }

  async function lock(
    e: MaybeElementRef | Event,
    // options?: PointerLockOptions,
  ) {
    if (!isSupported()) throw new Error('Pointer Lock API is not supported by your browser.');

    triggerElement.set(e instanceof Event ? (e.currentTarget as HTMLElement) : null);
    targetElement =
      e instanceof Event ? (unrefElement(target) ?? triggerElement()) : unrefElement(e);
    if (!targetElement) {
      throw new Error('Target element undefined.');
    }
    (targetElement as HTMLElement).requestPointerLock();

    // Wait for pointer lock to be established (equivalent to Vue's until(element).toBe(targetElement))
    let attempts = 0;
    const maxAttempts = 50;
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (element() === targetElement) return targetElement;
      attempts++;
    }
    return targetElement as MaybeElement;
  }

  async function unlock() {
    if (!element()) return false;

    document!.exitPointerLock();

    // Wait for pointer lock to be released (equivalent to Vue's until(element).toBeNull())
    let attempts = 0;
    const maxAttempts = 50;
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (!element()) return true;
      attempts++;
    }
    return false;
  }

  return {
    isSupported,
    element,
    triggerElement,
    lock,
    unlock,
  };
}
