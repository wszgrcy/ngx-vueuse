import type { Signal } from '@angular/core';
import { signal, computed } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { usePreferredDark } from '../usePreferredDark';
import { useStorage } from '../useStorage';
import { watch } from '@cyia/ngx-vueuse/patch';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';

export type BasicColorMode = 'light' | 'dark';
export type BasicColorSchema = BasicColorMode | 'auto';

export interface UseColorModeOptions<T extends string = BasicColorMode> {
  /**
   * CSS Selector for the target element applying to
   * @default 'html'
   */
  selector?: string;

  /**
   * HTML attribute applying the target element
   * @default 'class'
   */
  attribute?: string;

  /**
   * The initial color mode
   * @default 'auto'
   */
  initialValue?: T | BasicColorSchema;

  /**
   * Prefix when adding value to the attribute
   */
  modes?: Partial<Record<T | BasicColorSchema, string>>;

  /**
   * A custom handler for handle the updates.
   * When specified, the default behavior will be overridden.
   */
  onChanged?: (
    mode: T | BasicColorMode,
    defaultHandler: (mode: T | BasicColorMode) => void,
  ) => void;

  /**
   * Custom storage ref
   *
   * When provided, `useStorage` will be skipped
   */
  storageRef?: Signal<T | BasicColorSchema>;

  /**
   * Key to persist the data into localStorage/sessionStorage.
   * Pass `null` to disable persistence
   * @default 'vueuse-color-scheme'
   */
  storageKey?: string | null;

  /**
   * Storage object, can be localStorage or sessionStorage
   * @default localStorage
   */
  storage?: Storage;

  /**
   * Listen to storage changes, useful for multiple tabs application
   *
   * @default true
   */
  listenToStorageChanges?: boolean;

  /**
   * Emit `auto` mode from state
   *
   * When set to `true`, preferred mode won't be translated into `light` or `dark`.
   * This is useful when the fact that `auto` mode was selected needs to be known.
   *
   * @default undefined
   * @deprecated use `store.value` when `auto` mode needs to be known
   * @see https://vueuse.org/core/useColorMode/#advanced-usage
   */
  emitAuto?: boolean;

  /**
   * Disable transition on switch
   * @default true
   */
  disableTransition?: boolean;
}

export interface UseColorModeReturn<T extends string = BasicColorMode> {
  mode: Signal<T | BasicColorMode>;
  system: Signal<BasicColorMode>;
  store: Signal<T | BasicColorSchema>;
  state: Signal<T | BasicColorMode>;
}

const CSS_DISABLE_TRANS =
  '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}';

/**
 * Reactive color mode with auto data persistence.
 *
 * @see https://vueuse.org/useColorMode
 * @param options
 */
export function useColorMode<T extends string = BasicColorMode>(
  options: UseColorModeOptions<T> = {},
): UseColorModeReturn<T> {
  const {
    selector = 'html',
    attribute = 'class',
    initialValue = 'auto' as T | BasicColorSchema,
    listenToStorageChanges = true,
    storageRef,
    emitAuto,
    disableTransition = true,
    storageKey = 'vueuse-color-scheme',
    storage,
  } = options;

  const window = defaultWindow;

  // Build modes map
  const modes = {
    auto: '',
    light: 'light',
    dark: 'dark',
    ...options.modes,
  } as Record<string, string>;

  // Get system preferred mode
  const preferredDark = usePreferredDark({ window });
  const system = computed<BasicColorMode>(() => (preferredDark() ? 'dark' : 'light'));

  // Create storage ref or use simple signal
  let store: Signal<T | BasicColorSchema>;
  if (storageRef) {
    store = storageRef;
  } else if (storageKey === null) {
    store = signal(initialValue);
  } else {
    store = useStorage(storageKey, initialValue, storage, {
      window,
      listenToStorageChanges,
    }) as any;
  }

  // Compute state: auto -> system mode, otherwise store value
  const state = computed<T | BasicColorMode>(() =>
    store() === 'auto' ? system() : (store() as T | BasicColorMode),
  );

  const mode = state as Signal<T | BasicColorMode>;

  // Create auto with emitAuto support
  // When emitAuto is true, return store value (which can be 'auto')
  // Otherwise, return the resolved state (light/dark)
  const auto = computed<T | BasicColorSchema>(() => (emitAuto ? store() : state()));

  // Update HTML attributes
  const updateHTMLAttrs = (sel: string, attr: string, val: string) => {
    if (!window) return;

    const el = typeof sel === 'string' ? window.document.querySelector(sel) : null;

    if (!el) return;

    const classesToAdd = new Set<string>();
    const classesToRemove = new Set<string>();
    let attributeToChange: { key: string; value: string } | null = null;

    if (attr === 'class') {
      const current = val.split(/\s/g);
      Object.values(modes)
        .flatMap((i) => (i || '').split(/\s/g))
        .filter(Boolean)
        .forEach((v) => {
          if (current.includes(v)) classesToAdd.add(v);
          else classesToRemove.add(v);
        });
    } else {
      attributeToChange = { key: attr, value: val };
    }

    if (classesToAdd.size === 0 && classesToRemove.size === 0 && attributeToChange === null) return;

    let style: HTMLStyleElement | undefined;
    if (disableTransition) {
      style = window.document.createElement('style');
      style.appendChild(window.document.createTextNode(CSS_DISABLE_TRANS));
      window.document.head.appendChild(style);
    }

    for (const c of classesToAdd) el.classList.add(c);
    for (const c of classesToRemove) el.classList.remove(c);
    if (attributeToChange) el.setAttribute(attributeToChange.key, attributeToChange.value);

    if (disableTransition && style) {
      // Force browser to redraw
      window.getComputedStyle(style).opacity;
      window.document.head.removeChild(style);
    }
  };

  const defaultOnChanged = (mode: T | BasicColorMode) => {
    updateHTMLAttrs(selector, attribute, modes[mode] ?? mode);
  };

  const onChanged = (mode: T | BasicColorMode) => {
    if (options.onChanged) options.onChanged(mode, defaultOnChanged);
    else defaultOnChanged(mode);
  };

  // Watch state changes
  watch(state, onChanged, { immediate: true });

  tryOnMounted(() => onChanged(state()));

  return Object.assign(auto, { store, system, state }) as unknown as UseColorModeReturn<T>;
}
