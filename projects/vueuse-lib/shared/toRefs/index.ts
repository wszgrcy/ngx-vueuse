import { computed, isSignal, signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { toValue } from '../utils/general';

export interface ToRefsOptions {
  /**
   * Replace the original ref with a copy on property update.
   *
   * @default true
   */
  replaceRef?: SignalOrValue<boolean>;
}

/**
 * Extended `toRefs` that also accepts signals of an object.
 * Returns Angular Signals (not custom ref objects).
 *
 * Each returned ref is a callable Signal that:
 * - Can be called like a Signal: `refs.a()` to read
 * - Supports `.value` assignment: `refs.a.value = 'x'` to write
 * - Integrates with Angular's effect tracking via computed()
 *
 * @param objectRef A signal or normal object or array.
 * @param options Options
 */
export function toRefs<T extends object>(
  objectRef: SignalOrValue<T>,
  options: ToRefsOptions = {},
): { [K in keyof T]: any } {
  if (!isSignal(objectRef)) return _toRefs(objectRef as T);

  const signalRef = objectRef as WritableSignal<T>;
  const replaceRefValue = toValue(options.replaceRef) ?? true;
  const result: any = Array.isArray(signalRef())
    ? Array.from({ length: (signalRef() as any).length })
    : {};

  for (const key in signalRef()) {
    result[key] = createWritableSignalRef(signalRef, key, replaceRefValue);
  }
  return result;
}

/**
 * Create a writable Signal ref for a single key of a signal object.
 * Returns an Angular-compatible Signal with a `.value` property setter.
 *
 * Uses computed() to track property access, equivalent to Vue's customRef behavior.
 * The replaceRef option only affects the write behavior (immutable vs mutable update),
 * not the read tracking mechanism.
 */
function createWritableSignalRef<T>(
  signalRef: WritableSignal<T>,
  key: string | number,
  replaceRef: boolean,
): any {
  // Use computed() to track property access, equivalent to Vue's customRef
  const valueComputed = computed(() => (signalRef() as any)[key]);

  const callable: any = function (this: any, ...args: unknown[]): unknown {
    if (args.length === 0) {
      return valueComputed();
    }
    (callable as any).value = args[0];
    return (callable as any).value;
  };

  Object.defineProperty(callable, 'value', {
    get() {
      return valueComputed();
    },
    set(v: unknown) {
      const current = signalRef();
      if (replaceRef) {
        // Replace the entire object/array (immutable update)
        if (Array.isArray(current)) {
          const copy: any = [...current];
          copy[key] = v;
          signalRef.set(copy as T);
        } else {
          const newObject = { ...current, [key]: v };
          Object.setPrototypeOf(newObject, Object.getPrototypeOf(current));
          signalRef.set(newObject);
        }
      } else {
        // Mutable update: create new object with modified property
        // This triggers signal update while maintaining equivalent behavior
        if (Array.isArray(current)) {
          const copy: any = [...current];
          copy[key] = v;
          signalRef.set(copy as T);
        } else {
          const newObject = { ...current, [key]: v };
          Object.setPrototypeOf(newObject, Object.getPrototypeOf(current));
          signalRef.set(newObject);
        }
      }
    },
    configurable: true,
    enumerable: true,
  });

  return callable;
}

function _toRefs<T extends object>(obj: T): { [K in keyof T]: any } {
  const result: any = {};
  for (const key in obj) {
    result[key] = computed(() => obj[key]);
  }
  return result;
}
