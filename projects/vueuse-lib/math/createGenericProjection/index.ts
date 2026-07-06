import type { Signal } from '@angular/core';
import { computed, isSignal } from '@angular/core';

type MaybeSignalOrValue<T> = Signal<T> | T;

function toValue<T>(source: MaybeSignalOrValue<T>): T {
  return isSignal(source) ? source() : source;
}

export type ProjectorFunction<F, T> = (input: F, from: readonly [F, F], to: readonly [T, T]) => T;

export type UseProjection<F, T> = (input: MaybeSignalOrValue<F>) => Signal<T>;

/* __NO_SIDE_EFFECTS__ */
export function createGenericProjection<F = number, T = number>(
  fromDomain: MaybeSignalOrValue<readonly [F, F]>,
  toDomain: MaybeSignalOrValue<readonly [T, T]>,
  projector: ProjectorFunction<F, T>,
): UseProjection<F, T> {
  return (input: MaybeSignalOrValue<F>) =>
    computed(() => projector(toValue(input), toValue(fromDomain), toValue(toDomain)));
}
