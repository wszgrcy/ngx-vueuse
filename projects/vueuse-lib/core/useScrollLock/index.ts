import type { Signal } from '@angular/core';
import { computed, signal, untracked } from '@angular/core';
import type { Fn } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { isIOS } from '@cyia/ngx-vueuse/shared';
import { useEventListener } from '../useEventListener';
import { resolveElement } from '../_resolve-element';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';

/**
 * Writable computed-like signal for useScrollLock.
 * Provides both get () => T and set (value: T) => void interface.
 * Can be called as function(): T or function(value: T): T
 */
interface WritableComputed<T> {
  (): T;
  (value: T): T;
  value: T;
}

function checkOverflowScroll(ele: Element): boolean {
  const style = window.getComputedStyle(ele);
  if (
    style.overflowX === 'scroll' ||
    style.overflowY === 'scroll' ||
    (style.overflowX === 'auto' && ele.clientWidth < ele.scrollWidth) ||
    (style.overflowY === 'auto' && ele.clientHeight < ele.scrollHeight)
  ) {
    return true;
  } else {
    const parent = ele.parentNode as Element;

    if (!parent || parent.tagName === 'BODY') return false;

    return checkOverflowScroll(parent);
  }
}

function preventDefault(rawEvent: TouchEvent): boolean {
  const e = rawEvent || window.event;

  const _target = e.target as Element;

  // Do not prevent if element or parentNodes have overflow: scroll set.
  if (checkOverflowScroll(_target)) return false;

  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
  if (e.touches.length > 1) return true;

  if (e.preventDefault) e.preventDefault();

  return false;
}

const elInitialOverflow = new WeakMap<HTMLElement, CSSStyleDeclaration['overflow']>();

/**
 * Lock scrolling of the element.
 *
 * @see https://vueuse.org/useScrollLock
 * @param element
 */
export function useScrollLock(
  element:
    | Signal<HTMLElement | SVGElement | Window | Document | null | undefined>
    | (HTMLElement | SVGElement | Window | Document | null | undefined)
    | (() => HTMLElement | SVGElement | Window | Document | null | undefined),
  initialState = false,
) {
  const isLocked = signal(initialState);
  let stopTouchMoveListener: Fn | null = null;
  let initialOverflow: CSSStyleDeclaration['overflow'] = '';

  const elementGetter = typeof element === 'function' ? element : () => element;

  // Watch element changes (equivalent to Vue's watch with immediate: true)
  watch(
    () => toValue(elementGetter()),
    (el) => {
      const target = resolveElement(el);
      if (target) {
        const ele = target as HTMLElement;
        if (!elInitialOverflow.get(ele)) elInitialOverflow.set(ele, ele.style.overflow);

        if (ele.style.overflow !== 'hidden') initialOverflow = ele.style.overflow;

        if (ele.style.overflow === 'hidden') return untracked(() => isLocked.set(true));

        if (isLocked()) return (ele.style.overflow = 'hidden');
      }
    },
    { immediate: true },
  );

  const lock = () => {
    const el = resolveElement(toValue(elementGetter()));
    if (!el || isLocked()) return;
    if (isIOS) {
      stopTouchMoveListener = useEventListener(
        el,
        'touchmove',
        (e) => {
          preventDefault(e as TouchEvent);
        },
        { passive: false },
      );
    }
    el.style.overflow = 'hidden';
    isLocked.set(true);
  };

  const unlock = () => {
    const el = resolveElement(toValue(elementGetter()));
    if (!el || !isLocked()) return;
    if (isIOS) stopTouchMoveListener?.();
    el.style.overflow = initialOverflow;
    elInitialOverflow.delete(el as HTMLElement);
    isLocked.set(false);
  };

  tryOnScopeDispose(unlock);

  // Create a writable computed-like signal
  const lockedComputed = computed(() => isLocked());
  const result = ((v?: boolean) => {
    if (v === undefined) return lockedComputed();
    if (v) lock();
    else unlock();
    return lockedComputed();
  }) as WritableComputed<boolean>;
  result.value = lockedComputed();

  return result;
}
