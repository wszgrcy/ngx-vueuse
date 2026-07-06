import type { Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { MaybeElementRef } from '../unrefElement';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import { computed, signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useMutationObserver } from '../useMutationObserver';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';

export interface UseCssVarOptions extends ConfigurableWindow {
  initialValue?: string;
  /**
   * Use MutationObserver to monitor variable changes
   * @default false
   */
  observe?: boolean;
}

/**
 * Manipulate CSS variables.
 *
 * @see https://vueuse.org/useCssVar
 * @param prop
 * @param target
 * @param options
 */
export function useCssVar(
  prop: MaybeRefOrGetter<string | null | undefined>,
  target?: MaybeElementRef,
  options: UseCssVarOptions = {},
): Signal<string | undefined> {
  const { window = defaultWindow, initialValue, observe = false } = options;
  const variable = signal(initialValue);
  const elRef = computed(() => unrefElement(target) || window?.document?.documentElement);

  function updateCssVar() {
    const key = toValue(prop);
    const el = elRef();
    if (el && window && key) {
      const value = window.getComputedStyle(el).getPropertyValue(key)?.trim();
      variable.set(value || variable() || initialValue);
    }
  }

  if (observe) {
    useMutationObserver(elRef, updateCssVar, {
      attributeFilter: ['style', 'class'],
      window,
    });
  }

  watch(
    [elRef, () => toValue(prop)],
    (_, old) => {
      if (old && old[0] && old[1]) old[0].style.removeProperty(old[1]);
      updateCssVar();
    },
    { immediate: true },
  );

  watch(
    [variable, elRef],
    ([val, el]) => {
      const raw_prop = toValue(prop);
      if (el?.style && raw_prop) {
        if (val == null) el.style.removeProperty(raw_prop);
        else el.style.setProperty(raw_prop, val);
      }
    },
    { immediate: true },
  );

  return variable;
}
