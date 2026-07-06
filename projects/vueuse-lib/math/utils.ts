import { isSignal } from '@angular/core';

export type MaybeRefOrGetter<T> = T | (() => T);

type SignalOrValue<T> = T | { (): T };

function toValue<T>(v: SignalOrValue<T> | (() => T)): T {
  if (isSignal(v)) return v() as T;
  if (typeof v === 'function') return (v as () => T)();
  return v as unknown as T;
}

export type MaybeComputedRefArgs<T> =
  | MaybeRefOrGetter<T>[]
  | [MaybeRefOrGetter<MaybeRefOrGetter<T>[]>];

export function toValueArgsFlat<T>(args: MaybeComputedRefArgs<T>): T[] {
  return args.flatMap((i: any) => {
    const v = toValue(i);
    if (Array.isArray(v)) return v.map((i) => toValue(i));
    return [v];
  });
}
