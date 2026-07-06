import type { Signal } from '@angular/core';
import { isSignal } from '@angular/core';
import { reactify } from '@cyia/ngx-vueuse/shared';

type MaybeSignalOrValue<T> = Signal<T> | T;

function toValue<T>(source: MaybeSignalOrValue<T>): T {
  return isSignal(source) ? source() : source;
}

export type UseMathKeys = keyof {
  [K in keyof Math as Math[K] extends (...args: any) => any ? K : never]: unknown;
};

export type UseMathReturn<K extends keyof Math> = ReturnType<
  Parameters<typeof reactify>[0] extends (...args: infer A) => infer R
    ? (...args: { [K in keyof A]: MaybeSignalOrValue<A[K]> }) => Signal<R>
    : never
>;

/**
 * Reactive `Math` methods.
 *
 * @see https://vueuse.org/useMath
 *
 * __NO_SIDE_EFFECTS__
 */
export function useMath<K extends keyof Math>(key: K, ...args: any[]): Signal<any> {
  return reactify(Math[key] as any)(...args) as UseMathReturn<K>;
}
