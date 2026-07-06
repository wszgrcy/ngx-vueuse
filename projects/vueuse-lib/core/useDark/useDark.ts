import type { Signal, WritableSignal } from '@angular/core';
import { computed } from '@angular/core';
import type { BasicColorSchema, UseColorModeOptions } from '../useColorMode';
import { useColorMode } from '../useColorMode';

// Note: useColorMode returns a signal with additional properties (store, system, state)
// The returned object IS the mode signal itself, not an object containing mode
interface UseColorModeReturnWritable<T extends string = BasicColorSchema> {
  (): T | BasicColorSchema;
  system: Signal<BasicColorSchema>;
  store: WritableSignal<T | BasicColorSchema>;
  state: Signal<T | BasicColorSchema>;
}

export interface UseDarkOptions extends Omit<
  UseColorModeOptions<BasicColorSchema>,
  'modes' | 'onChanged'
> {
  /**
   * Value applying to the target element when isDark=true
   *
   * @default 'dark'
   */
  valueDark?: string;

  /**
   * Value applying to the target element when isDark=false
   *
   * @default ''
   */
  valueLight?: string;

  /**
   * A custom handler for handle the updates.
   * When specified, the default behavior will be overridden.
   *
   * @default undefined
   */
  onChanged?: (
    isDark: boolean,
    defaultHandler: (mode: BasicColorSchema) => void,
    mode: BasicColorSchema,
  ) => void;
}

export type UseDarkReturn = { (): boolean; set: (v: boolean) => void };

/**
 * Reactive dark mode with auto data persistence.
 *
 * @see https://vueuse.org/useDark
 * @param options
 */
export function useDark(options: UseDarkOptions = {}) {
  const { valueDark = 'dark', valueLight = '' } = options;

  const mode = useColorMode({
    ...options,
    onChanged: (mode, defaultHandler) => {
      if (options.onChanged)
        options.onChanged?.(mode === 'dark', defaultHandler, mode as BasicColorSchema);
      else defaultHandler(mode);
    },
    modes: {
      dark: valueDark,
      light: valueLight,
    },
  }) as unknown as UseColorModeReturnWritable;

  const system = computed(() => mode.system());

  const isDark: UseDarkReturn = Object.assign(
    computed(() => mode() === 'dark'),
    {
      set(v: boolean) {
        const modeVal = v ? 'dark' : 'light';
        if (system() === modeVal) mode.store.set('auto');
        else mode.store.set(modeVal);
      },
    },
  );

  return isDark;
}
