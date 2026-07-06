import {
  ElementRef,
  WritableSignal,
  assertInInjectionContext,
  inject,
  signal,
  untracked,
  afterNextRender,
} from '@angular/core';
import type { MaybeElement, MaybeElementRef } from '../unrefElement';
import { unrefElement } from '../unrefElement';

/**
 * Get the current root element of the component.
 *
 * In Angular, this returns the host element of the current component.
 * Optionally, you can pass a component type or element ref to get the root element from a child component.
 *
 * @param rootComponent - Optional component instance, element ref, or component type to get the root element from
 *
 * @example
 * ```ts
 * // Get current component's root element
 * const el = useCurrentElement();
 *
 * // Get a child component's root element
 * const childEl = useCurrentElement(childComponentRef);
 * ```
 */
export function useCurrentElement<E extends MaybeElement = HTMLElement>(
  rootComponent?: MaybeElementRef,
): WritableSignal<E | undefined> {
  assertInInjectionContext(useCurrentElement);

  // Get the current component's ElementRef
  const currentElRef = inject(ElementRef);

  // Create a signal to hold the current element
  const currentElement = signal<E | undefined>(undefined as unknown as E);

  // Use afterNextRender to get the element after it's created (equivalent to onMounted)
  afterNextRender(() => {
    // If a rootComponent is provided, use it; otherwise use the current component's host element
    const el = rootComponent
      ? (unrefElement(rootComponent) as E)
      : (currentElRef.nativeElement as unknown as E);

    untracked(() => currentElement.set(el));
  });

  return currentElement;
}
