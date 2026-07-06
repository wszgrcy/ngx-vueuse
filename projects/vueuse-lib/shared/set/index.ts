import type { Signal, WritableSignal } from '../utils/types';

export function set<T>(ref: Signal<T>, value: T): void;
export function set<O extends object, K extends keyof O>(target: O, key: K, value: O[K]): void;

/**
 *  Shorthand for `ref.value = x`
 */
export function set(...args: any[]) {
  if (args.length === 2) {
    const [ref, value] = args;
    (ref as WritableSignal<any>).set(value);
  }
  if (args.length === 3) {
    const [target, key, value] = args;
    target[key] = value;
  }
}
