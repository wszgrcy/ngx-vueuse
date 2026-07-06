import { ElementRef, type Signal } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';

export type MaybeElement = HTMLElement | SVGElement | ElementRef<HTMLElement> | undefined | null;

export type MaybeElementRef<T extends MaybeElement = MaybeElement> = SignalOrValue<T>;

export type MaybeComputedElementRef<T extends MaybeElement = MaybeElement> = SignalOrGetter<T>;

type SignalOrValue<T> = Signal<T> | T | (() => T);
type SignalOrGetter<T> = T | (() => T);

export type UnRefElementReturn<T extends MaybeElement = MaybeElement> =
  T extends ElementRef<infer E> ? E | undefined : Exclude<T, ElementRef<any>> | undefined;

/**
 * Get the dom element of a ref of element.
 * For Angular, elements are just HTMLElement or SVGElement.
 *
 * @param elRef
 */
export function unrefElement<T extends MaybeElement>(
  elRef: MaybeComputedElementRef<T>,
): UnRefElementReturn<T> {
  const plain = toValue(elRef as SignalOrGetter<T>);
  return (plain as ElementRef)?.nativeElement ?? plain;
}
