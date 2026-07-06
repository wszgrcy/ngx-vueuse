import type { Signal } from '@angular/core';
import { toValue } from '../utils/general';

export type IsDefinedReturn = boolean;

export function isDefined<T>(v: Signal<T> | T): v is Signal<Exclude<T, null | undefined>> {
  return toValue(v) != null;
}
