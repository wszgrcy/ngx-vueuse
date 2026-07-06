import { toValue } from '../utils/general';

/**
 * Shorthand for accessing `signal()` or value
 */
export function get<T>(ref: T): T;
export function get<T, K extends string & keyof T>(ref: T, key: K): T[K];
export function get(obj: any, key?: string | number | symbol) {
  if (key == null) return toValue(obj);
  return toValue(obj)[key];
}
