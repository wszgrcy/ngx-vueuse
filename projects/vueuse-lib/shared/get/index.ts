import type { MaybeRefOrGetter } from '../utils/types';
import { toValue } from '../utils/general';

/**
 * Shorthand for accessing `ref.value`
 */
export function get<T>(ref: MaybeRefOrGetter<T>): T;
export function get<T, K extends keyof T>(ref: MaybeRefOrGetter<T>, key: K): T[K];
export function get(obj: MaybeRefOrGetter<any>, key?: string | number | symbol) {
  if (key == null) return toValue(obj);
  return toValue(obj)[key];
}
