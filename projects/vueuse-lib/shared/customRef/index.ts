import type { Fn } from '../utils/types';

export interface CustomRef<T> {
  readonly value: T;
  /**
   * Force update the custom ref.
   */
  trigger: () => void;
}

export function customRef<T>(
  factory: (
    onTrack: Fn,
    onTrigger: Fn,
  ) => {
    get: () => T;
    set: (value: T) => void;
  },
): CustomRef<T> {
  let value: T;
  let dirty = true;
  let _onTrigger: () => void = () => {};

  const { get, set } = factory(
    () => {}, // onTrack - not used in Angular signals model
    () => {
      // Just mark as dirty, don't call _onTrigger here
      dirty = true;
    },
  );
  value = get();

  const ref = {
    get value(): T {
      if (dirty) {
        value = get();
        dirty = false;
      }
      return value;
    },
    set value(newVal: T) {
      set(newVal);
    },
  } as CustomRef<T>;

  // Set trigger after ref is created to avoid circular dependency
  Object.defineProperty(ref, 'trigger', {
    get() {
      return _onTrigger;
    },
    set(fn: () => void) {
      _onTrigger = fn;
    },
    configurable: true,
  });

  return ref;
}
