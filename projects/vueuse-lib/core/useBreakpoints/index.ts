import type { Signal } from '@angular/core';
import { computed, signal, afterNextRender } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { defaultWindow } from '../_configurable';
import { increaseWithUnit, pxValue, toValue } from '@cyia/ngx-vueuse/shared';
import { useMediaQuery } from '../useMediaQuery';
import { useSSRWidth } from '../useSSRWidth';

type MaybeRefOrGetter<T> = Signal<T> | T | (() => T);

export * from './breakpoints';

export type Breakpoints<K extends string = string> = Record<K, MaybeRefOrGetter<number | string>>;

export interface UseBreakpointsOptions extends ConfigurableWindow {
  /**
   * The query strategy to use for the generated shortcut methods like `.lg`
   *
   * 'min-width' - .lg will be true when the viewport is greater than or equal to the lg breakpoint (mobile-first)
   * 'max-width' - .lg will be true when the viewport is smaller than the xl breakpoint (desktop-first)
   *
   * @default "min-width"
   */
  strategy?: 'min-width' | 'max-width';
  ssrWidth?: number;
}

export type UseBreakpointReturn<K extends string = string> = Record<K, Signal<boolean>> & {
  greaterOrEqual: (k: MaybeRefOrGetter<K>) => Signal<boolean>;
  smallerOrEqual: (k: MaybeRefOrGetter<K>) => Signal<boolean>;
  greater: (k: MaybeRefOrGetter<K>) => Signal<boolean>;
  smaller: (k: MaybeRefOrGetter<K>) => Signal<boolean>;
  between: (a: MaybeRefOrGetter<K>, b: MaybeRefOrGetter<K>) => Signal<boolean>;
  isGreater: (k: MaybeRefOrGetter<K>) => boolean;
  isGreaterOrEqual: (k: MaybeRefOrGetter<K>) => boolean;
  isSmaller: (k: MaybeRefOrGetter<K>) => boolean;
  isSmallerOrEqual: (k: MaybeRefOrGetter<K>) => boolean;
  isInBetween: (a: MaybeRefOrGetter<K>, b: MaybeRefOrGetter<K>) => boolean;
  current: () => Signal<K[]>;
  active: () => Signal<K | ''>;
};

/**
 * Reactively viewport breakpoints
 *
 * @see https://vueuse.org/useBreakpoints
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useBreakpoints<K extends string>(
  breakpoints: Breakpoints<K>,
  options: UseBreakpointsOptions = {},
): UseBreakpointReturn<K> {
  function getValue(k: MaybeRefOrGetter<K>, delta?: number) {
    let v = toValue(breakpoints[toValue(k)]);

    if (delta != null) v = increaseWithUnit(v, delta);

    if (typeof v === 'number') v = `${v}px`;

    return v;
  }

  const { window = defaultWindow, strategy = 'min-width', ssrWidth = useSSRWidth() } = options;

  const ssrSupport = typeof ssrWidth === 'number';
  const mounted = ssrSupport ? signal(false) : signal(true);

  if (ssrSupport) {
    afterNextRender(() => {
      mounted.set(!!window);
    });
  }

  function match(query: 'min' | 'max', size: string): boolean {
    if (ssrSupport && !mounted()) {
      return query === 'min' ? ssrWidth! >= pxValue(size) : ssrWidth! <= pxValue(size);
    }
    if (!window) return false;
    return window.matchMedia(`(${query}-width: ${size})`).matches;
  }

  const greaterOrEqual = (k: MaybeRefOrGetter<K>) =>
    useMediaQuery(() => `(min-width: ${getValue(k)})`, options);

  const smallerOrEqual = (k: MaybeRefOrGetter<K>) =>
    useMediaQuery(() => `(max-width: ${getValue(k)})`, options);

  const shortcutMethods = (Object.keys(breakpoints) as K[]).reduce(
    (shortcuts, k) => {
      Object.defineProperty(shortcuts, k, {
        get: () => (strategy === 'min-width' ? greaterOrEqual(k) : smallerOrEqual(k)),
        enumerable: true,
        configurable: true,
      });
      return shortcuts;
    },
    {} as Record<K, ReturnType<typeof greaterOrEqual>>,
  );

  function current() {
    const points = (Object.keys(breakpoints) as K[])
      .map((k) => [k, shortcutMethods[k], pxValue(getValue(k))] as const)
      .sort((a, b) => a[2] - b[2]);
    return computed(() => points.filter(([, v]) => v()).map(([k]) => k));
  }

  return Object.assign(shortcutMethods, {
    greaterOrEqual,
    smallerOrEqual,
    greater(k: MaybeRefOrGetter<K>) {
      return useMediaQuery(() => `(min-width: ${getValue(k, 0.1)})`, options);
    },
    smaller(k: MaybeRefOrGetter<K>) {
      return useMediaQuery(() => `(max-width: ${getValue(k, -0.1)})`, options);
    },
    between(a: MaybeRefOrGetter<K>, b: MaybeRefOrGetter<K>) {
      return useMediaQuery(
        () => `(min-width: ${getValue(a)}) and (max-width: ${getValue(b, -0.1)})`,
        options,
      );
    },
    isGreater(k: MaybeRefOrGetter<K>) {
      return match('min', getValue(k, 0.1));
    },
    isGreaterOrEqual(k: MaybeRefOrGetter<K>) {
      return match('min', getValue(k));
    },
    isSmaller(k: MaybeRefOrGetter<K>) {
      return match('max', getValue(k, -0.1));
    },
    isSmallerOrEqual(k: MaybeRefOrGetter<K>) {
      return match('max', getValue(k));
    },
    isInBetween(a: MaybeRefOrGetter<K>, b: MaybeRefOrGetter<K>) {
      return match('min', getValue(a)) && match('max', getValue(b, -0.1));
    },
    current,
    active() {
      const bps = current();
      return computed(() => (bps().length === 0 ? '' : bps()[strategy === 'min-width' ? -1 : 0]!));
    },
  });
}
