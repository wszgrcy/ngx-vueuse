import { computed, isSignal, type WritableSignal, signal } from '@angular/core';
import type { SignalOrValue } from '../utils/types';
import { toValue } from '../utils/general';

/**
 * Converts signal to reactive proxy-like access.
 * Replicates Vue's toReactive behavior using Proxy pattern.
 *
 * @param objectRef A signal of object
 */
export function toReactive<T extends object>(objectRef: SignalOrValue<T>): T {
  const unwrapped = toValue(objectRef);

  if (!isSignal(objectRef)) return unwrapped as T;

  // Create a reactive proxy that unwraps nested signals (matching Vue's toReactive)
  const proxy = new Proxy(
    {},
    {
      get(_, p, receiver) {
        const current = objectRef();
        const val = (current as any)[p as string];
        // If the nested value is a signal, return its computed version
        if (isSignal(val)) {
          return computed(() => val());
        }
        return toValue(val);
      },
      set(_, p, value) {
        // Get the current signal (must be WritableSignal for mutation)
        const signalRef = objectRef as WritableSignal<T>;
        const currentVal = (signalRef() as any)[p as string];
        // If the property is a signal, update it
        if (isSignal(currentVal) && !isSignal(value)) {
          if ('set' in currentVal && typeof (currentVal as any).set === 'function') {
            (currentVal as any).set(value);
            return true;
          }
        }
        // Create a new object with the property updated, then set it on the signal
        const current = { ...signalRef(), [p as string]: value };
        signalRef.set(current);
        return true;
      },
      deleteProperty(targetObj, p) {
        // Get the current signal (must be WritableSignal for mutation)
        const signalRef = objectRef as WritableSignal<T>;
        const current = signalRef();
        const { [p as string]: _removed, ...rest } = current as any;
        signalRef.set(rest as T);
        return true;
      },
      has(_, p) {
        const current = objectRef();
        return Reflect.has(current, p);
      },
      ownKeys() {
        const current = objectRef();
        return Object.keys(current);
      },
      getOwnPropertyDescriptor() {
        return {
          enumerable: true,
          configurable: true,
        };
      },
    },
  );

  return proxy as T;
}
