import type { Signal } from '@angular/core';
import { isSignal } from '@angular/core';
import type { ProjectorFunction } from '../createGenericProjection';
import { createProjection } from '../createProjection';

type MaybeSignalOrValue<T> = Signal<T> | T;

function toValue<T>(source: MaybeSignalOrValue<T>): T {
  return isSignal(source) ? source() : source;
}

/**
 * Reactive numeric projection from one domain to another.
 *
 * @see https://vueuse.org/useProjection
 *
 * __NO_SIDE_EFFECTS__
 */
export function useProjection(
  input: MaybeSignalOrValue<number>,
  fromDomain: MaybeSignalOrValue<readonly [number, number]>,
  toDomain: MaybeSignalOrValue<readonly [number, number]>,
  projector?: ProjectorFunction<number, number>,
): Signal<number> {
  return createProjection(fromDomain, toDomain, projector)(input);
}
