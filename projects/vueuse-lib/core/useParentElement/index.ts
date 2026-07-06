import { signal, type Signal } from '@angular/core';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { unrefElement } from '../unrefElement';
import { useCurrentElement } from '../useCurrentElement/useCurrentElement';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';

export function useParentElement(
  element: MaybeRefOrGetter<HTMLElement | SVGElement | null | undefined> = useCurrentElement<
    HTMLElement | SVGElement
  >(),
): Readonly<Signal<HTMLElement | SVGElement | null | undefined>> {
  const parentElement = signal<HTMLElement | SVGElement | null | undefined>(undefined);

  const update = () => {
    const el = unrefElement(element);
    if (el) parentElement.set(el.parentElement);
  };

  tryOnMounted(update);
  watch(() => toValue(element), update);

  return parentElement;
}
