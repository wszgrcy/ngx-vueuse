import { computed, signal } from '@angular/core';
import type { Signal, SignalOrValue } from '../utils/types';

/**
 * Normalize signal/value/getter to `signal` or `computed`.
 */
export function toRef<T>(r: () => T): ReturnType<typeof computed>;
export function toRef<T>(r: ReturnType<typeof computed>): ReturnType<typeof computed>;
export function toRef<T>(r: SignalOrValue<T>): Signal<T>;
export function toRef<T>(r: T): Signal<T>;
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
): ReturnType<typeof computed>;
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue: T[K],
): ReturnType<typeof computed>;
export function toRef(...args: any[]) {
  if (args.length !== 1)
    // For object-key form or multi-arg form, create a computed that tracks the property
    return computed(() => {
      const [object, key, defaultValue] = args as [object, string, any];
      const value = (object as any)[key];
      return value === undefined ? defaultValue : value;
    });
  const r = args[0];
  return typeof r === 'function'
    ? // Getter function -> readonly computed signal
      computed(r as () => any)
    : // Plain value -> signal
      signal(r);
}
