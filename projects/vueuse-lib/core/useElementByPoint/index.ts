import { type Signal, signal } from '@angular/core';
import type { Pausable } from '@cyia/ngx-vueuse/shared';
import type { SignalOrValue } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableDocument, ConfigurableScheduler } from '../_configurable';
import type { Supportable } from '../types';
import { useIntervalFn } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultDocument } from '../_configurable';
import { useRafFn } from '../useRafFn';
import { useSupported } from '../useSupported';

function getDefaultScheduler(options: UseElementByPointOptions<boolean>) {
  if ('interval' in options || 'immediate' in options) {
    const { interval = 'requestAnimationFrame', immediate = true } = options;

    return interval === 'requestAnimationFrame'
      ? (cb: (...args: unknown[]) => unknown) => useRafFn(cb, { immediate })
      : (cb: (...args: unknown[]) => unknown) => useIntervalFn(cb, interval, { immediate });
  }

  return useRafFn;
}

export interface UseElementByPointOptions<Multiple extends boolean = false>
  extends ConfigurableDocument, ConfigurableScheduler {
  x: SignalOrValue<number>;
  y: SignalOrValue<number>;
  multiple?: SignalOrValue<Multiple>;
  /** @deprecated Please use `scheduler` option instead */
  immediate?: boolean;
  /** @deprecated Please use `scheduler` option instead */
  interval?: 'requestAnimationFrame' | number;
}

export interface UseElementByPointReturn<Multiple extends boolean = false>
  extends Supportable, Pausable {
  element: Signal<Multiple extends true ? HTMLElement[] : HTMLElement | null>;
}

/**
 * Reactive element by point.
 *
 * @see https://vueuse.org/useElementByPoint
 * @param options - UseElementByPointOptions
 */
export function useElementByPoint<M extends boolean = false>(
  options: UseElementByPointOptions<M>,
): UseElementByPointReturn<M> {
  const {
    x,
    y,
    document = defaultDocument,
    multiple,
    scheduler = getDefaultScheduler(options),
  } = options;

  const isSupported = useSupported(() => {
    if (toValue(multiple)) return document && 'elementsFromPoint' in document;

    return document && 'elementFromPoint' in document;
  });

  const element = signal<M extends true ? HTMLElement[] : HTMLElement | null>(null as any);

  const controls = scheduler(() => {
    const result = toValue(multiple)
      ? ((document?.elementsFromPoint(toValue(x), toValue(y)) as HTMLElement[]) ?? [])
      : ((document?.elementFromPoint(toValue(x), toValue(y)) as HTMLElement | null) ?? null);
    element.set(result as M extends true ? HTMLElement[] : HTMLElement | null);
  });

  return {
    isSupported,
    element,
    ...controls,
  };
}
