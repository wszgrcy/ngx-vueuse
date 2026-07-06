import { isSignal, type Signal } from '@angular/core';

type SignalOrValue<T> = Signal<T> | T;

export function toValue<T>(v: SignalOrValue<T> | (() => T)): T {
  if (isSignal(v)) return v() as T;
  if (typeof v === 'function') return (v as () => T)();
  return v as unknown as T;
}
