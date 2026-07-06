import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import { isClient } from '@cyia/ngx-vueuse/shared';
import { computed, isSignal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { useMounted } from '../useMounted';
import { toValue } from '@cyia/ngx-vueuse/shared';

type SignalOrGetter<T> = import('@angular/core').Signal<T> | T | (() => T);

export interface UseCssSupportsOptions extends ConfigurableWindow {
  ssrValue?: boolean;
}

export interface UseCssSupportsReturn extends Supportable {}

export function useCssSupports(
  property: SignalOrGetter<string>,
  value: SignalOrGetter<string>,
  options?: UseCssSupportsOptions,
): UseCssSupportsReturn;
export function useCssSupports(
  conditionText: SignalOrGetter<string>,
  options?: UseCssSupportsOptions,
): UseCssSupportsReturn;
export function useCssSupports(...args: any[]): UseCssSupportsReturn {
  let options: UseCssSupportsOptions = {};

  if (
    typeof toValue(args.at(-1) as SignalOrGetter<unknown> | UseCssSupportsOptions) === 'object' &&
    !isSignal(args.at(-1))
  ) {
    const lastArg = args.at(-1);
    if (lastArg !== undefined && typeof lastArg === 'object' && !isSignal(lastArg)) {
      options = args.pop() as UseCssSupportsOptions;
    }
  }

  const [prop, value] = args;

  const { window = defaultWindow, ssrValue = false } = options;

  const isMounted = useMounted();

  return {
    isSupported: computed(() => {
      if (!isClient || !isMounted()) {
        return ssrValue;
      }

      return args.length === 2
        ? // @ts-expect-error window type is not correct
          window?.CSS.supports(
            toValue(prop as SignalOrGetter<string>),
            toValue(value as SignalOrGetter<string>),
          )
        : // @ts-expect-error window type is not correct
          window?.CSS.supports(toValue(prop as SignalOrGetter<string>));
    }),
  };
}
