import type { Signal } from '@angular/core';

export function set<T>(signal: Signal<T>, value: T): void;
export function set<O extends object, K extends keyof O>(target: O, key: K, value: O[K]): void;

/**
 * Shorthand for `signal.set(value)` or `target[key] = value`
 */
export function set(...args: any[]) {
  if (args.length === 2) {
    const [signal, value] = args;
    if (typeof (signal as any).set === 'function') {
      (signal as any).set(value);
    }
  }
  if (args.length === 3) {
    const [target, key, value] = args;
    target[key] = value;
  }
}
