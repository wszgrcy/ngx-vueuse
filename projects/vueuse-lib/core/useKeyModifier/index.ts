import type { ConfigurableDocument } from '../_configurable';
import type { WindowEventName } from '../useEventListener';
import type { Signal } from '@angular/core';
import { signal } from '@angular/core';
import { defaultDocument } from '../_configurable';
import { useEventListener } from '../useEventListener';

export type KeyModifier =
  | 'Alt'
  | 'AltGraph'
  | 'CapsLock'
  | 'Control'
  | 'Fn'
  | 'FnLock'
  | 'Meta'
  | 'NumLock'
  | 'ScrollLock'
  | 'Shift'
  | 'Symbol'
  | 'SymbolLock';

const defaultEvents: WindowEventName[] = ['mousedown', 'mouseup', 'keydown', 'keyup'];

export interface UseModifierOptions<Initial> extends ConfigurableDocument {
  /**
   * Event names that will prompt update to modifier states
   *
   * @default ['mousedown', 'mouseup', 'keydown', 'keyup']
   */
  events?: WindowEventName[];

  /**
   * Initial value of the returned ref
   *
   * @default null
   */
  initial?: Initial;
}

export type UseKeyModifierReturn<Initial> = Signal<
  Initial extends boolean ? boolean : boolean | null
>;

/* @__NO_SIDE_EFFECTS__ */
export function useKeyModifier<Initial extends boolean | null>(
  modifier: KeyModifier,
  options: UseModifierOptions<Initial> = {},
): UseKeyModifierReturn<Initial> {
  const { events = defaultEvents, document = defaultDocument, initial = null } = options;

  const state = signal<Initial extends boolean ? boolean : boolean | null>(
    initial as Initial extends boolean ? boolean : boolean | null,
  );

  if (document) {
    events.forEach((listenerEvent) => {
      useEventListener(
        document,
        listenerEvent,
        (evt: KeyboardEvent | MouseEvent) => {
          if (typeof evt.getModifierState === 'function')
            state.set(
              evt.getModifierState(modifier) as Initial extends boolean ? boolean : boolean | null,
            );
        },
        { passive: true },
      );
    });
  }

  return state as UseKeyModifierReturn<Initial>;
}
