import type { Signal } from '@angular/core';
import { isSignal } from '@angular/core';
import type { ProjectorFunction, UseProjection } from '../createGenericProjection';
import { createGenericProjection } from '../createGenericProjection';

type MaybeSignalOrValue<T> = Signal<T> | T;

function toValue<T>(source: MaybeSignalOrValue<T>): T {
  return isSignal(source) ? source() : source;
}

function defaultNumericProjector(
  input: number,
  from: readonly [number, number],
  to: readonly [number, number],
) {
  return ((input - from[0]) / (from[1] - from[0])) * (to[1] - to[0]) + to[0];
}

/* __NO_SIDE_EFFECTS__ */
export function createProjection(
  fromDomain: MaybeSignalOrValue<readonly [number, number]>,
  toDomain: MaybeSignalOrValue<readonly [number, number]>,
  projector: ProjectorFunction<number, number> = defaultNumericProjector,
): UseProjection<number, number> {
  return createGenericProjection(fromDomain, toDomain, projector);
}
