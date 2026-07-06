import { signal, isSignal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import type { SignalOrValue } from '../utils/types';

export type ToggleFn<Truthy = true, Falsy = false> = (value?: Truthy | Falsy) => Truthy | Falsy;

export type UseToggleReturn<Truthy = true, Falsy = false> =
  | [WritableSignal<Truthy | Falsy>, ToggleFn<Truthy, Falsy>]
  | ToggleFn<Truthy, Falsy>;

export interface UseToggleOptions<Truthy, Falsy> {
  truthyValue?: SignalOrValue<Truthy>;
  falsyValue?: SignalOrValue<Falsy>;
}

/**
 * A boolean signal with a toggler
 *
 * @see https://vueuse.org/useToggle
 * @param [initialValue]
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useToggle<Truthy = true, Falsy = false>(
  initialValue: WritableSignal<Truthy | Falsy>,
  options?: UseToggleOptions<Truthy, Falsy>,
): ToggleFn<Truthy, Falsy>;
export function useToggle<Truthy = true, Falsy = false>(
  initialValue: Truthy | Falsy,
  options?: UseToggleOptions<Truthy, Falsy>,
): UseToggleReturn<Truthy, Falsy>;
export function useToggle<Truthy = true, Falsy = false>(
  initialValue?: SignalOrValue<Truthy | Falsy>,
  options?: UseToggleOptions<Truthy, Falsy>,
): UseToggleReturn<Truthy, Falsy>;
export function useToggle<Truthy = true, Falsy = false>(
  initialValue: SignalOrValue<Truthy | Falsy> = false as Truthy | Falsy,
  options: UseToggleOptions<Truthy, Falsy> = {},
): UseToggleReturn<Truthy, Falsy> {
  const { truthyValue = true as Truthy, falsyValue = false as Falsy } = options;

  const valueIsRef = isSignal(initialValue) && 'set' in initialValue;
  const _value = valueIsRef
    ? (initialValue as WritableSignal<Truthy | Falsy>)
    : (signal(initialValue) as WritableSignal<Truthy | Falsy>);

  function toggle(value?: Truthy | Falsy): Truthy | Falsy {
    // has arguments
    if (arguments.length) {
      _value.set(value!);
      return _value();
    } else {
      const truthy =
        truthyValue instanceof Function ? (truthyValue as () => Truthy)() : truthyValue;
      const falsy = falsyValue instanceof Function ? (falsyValue as () => Falsy)() : falsyValue;
      _value.set(_value() === truthy ? falsy : truthy);
      return _value();
    }
  }

  if (valueIsRef) return toggle;
  else return [_value, toggle] as const;
}
