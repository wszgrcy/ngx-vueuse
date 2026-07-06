import type { Signal } from '@angular/core';
import { computed, isSignal, signal } from '@angular/core';
import { noop } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { DefaultMagicKeysAliasMap } from './aliasMap';

type MagicKeysSignalOrValue<T> = Signal<T> | T;

export interface UseMagicKeysOptions<Reactive extends boolean> {
  /**
   * Returns a reactive object instead of an object of refs
   *
   * @default false
   */
  reactive?: Reactive;

  /**
   * Target for listening events
   *
   * @default window
   */
  target?: MagicKeysSignalOrValue<EventTarget>;

  /**
   * Alias map for keys, all the keys should be lowercase
   * { target: keycode }
   *
   * @example { ctrl: "control" }
   * @default <predefined-map>
   */
  aliasMap?: Record<string, string>;

  /**
   * Register passive listener
   *
   * @default true
   */
  passive?: boolean;

  /**
   * Custom event handler for keydown/keyup event.
   * Useful when you want to apply custom logic.
   *
   * When using `e.preventDefault()`, you will need to pass `passive: false` to useMagicKeys().
   */
  onEventFired?: (e: KeyboardEvent) => void | boolean;
}

export interface MagicKeysInternal {
  /**
   * A Set of currently pressed keys,
   * Stores raw keyCodes.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
   */
  current: Set<string>;
}

export type UseMagicKeysReturn<Reactive extends boolean> = Readonly<
  Record<string, Reactive extends true ? boolean : Signal<boolean>> & MagicKeysInternal
>;

function toValue<T>(source: Signal<T> | T): T {
  return isSignal(source) ? source() : source;
}

/**
 * Reactive keys pressed state, with magical keys combination support.
 *
 * @see https://vueuse.org/useMagicKeys
 */
export function useMagicKeys<T extends boolean = false>(
  options: UseMagicKeysOptions<T> = {},
): UseMagicKeysReturn<T> {
  const {
    reactive: useReactive = false,
    target = defaultWindow,
    aliasMap = DefaultMagicKeysAliasMap,
    passive = true,
    onEventFired = noop,
  } = options;

  const current: Set<string> = new Set();
  const obj: Record<string, unknown> = {
    toJSON() {
      return {};
    },
    current,
  };
  const refs: Record<string, unknown> = useReactive ? obj : { ...obj };
  const metaDeps = new Set<string>();
  const depsMap = new Map<string, Set<string>>([
    ['Meta', metaDeps],
    ['Shift', new Set<string>()],
    ['Alt', new Set<string>()],
  ]);
  const usedKeys = new Set<string>();

  function setRefs(key: string, value: boolean) {
    if (key in refs) {
      if (useReactive) (refs as Record<string, boolean>)[key] = value;
      else (refs as Record<string, ReturnType<typeof signal<boolean>>>)[key].set(value);
    }
  }

  function reset() {
    current.clear();
    for (const key of usedKeys) setRefs(key, false);
  }

  function updateDeps(value: boolean, e: KeyboardEvent, keys: string[]) {
    if (!value || typeof e.getModifierState !== 'function') return;
    for (const [modifier, depsSet] of depsMap) {
      if (e.getModifierState(modifier)) {
        keys.forEach((key) => depsSet.add(key));
        break;
      }
    }
  }

  function clearDeps(value: boolean, key: string) {
    if (value) return;
    const depsMapKey = `${key[0].toUpperCase()}${key.slice(1)}`;
    const deps = depsMap.get(depsMapKey);
    if (!['shift', 'alt'].includes(key) || !deps) return;

    const depsArray = Array.from(deps);
    const depsIndex = depsArray.indexOf(key);
    depsArray.forEach((depKey, index) => {
      if (index >= depsIndex) {
        current.delete(depKey);
        setRefs(depKey, false);
      }
    });
    deps.clear();
  }

  function updateRefs(e: KeyboardEvent, value: boolean) {
    const key = e.key?.toLowerCase();
    const code = e.code?.toLowerCase();
    const values = [code, key].filter(Boolean) as string[];

    if (!key) return;

    // current set
    if (key) {
      if (value) current.add(key);
      else current.delete(key);
    }

    for (const key of values) {
      usedKeys.add(key);
      setRefs(key, value);
    }

    updateDeps(value, e, [...current, ...values]);
    clearDeps(value, key);

    // #1312
    // In macOS, keys won't trigger "keyup" event when Meta key is released
    // We track it's combination and release manually
    if (key === 'meta' && !value) {
      // Meta key released
      metaDeps.forEach((depKey) => {
        current.delete(depKey);
        setRefs(depKey, false);
      });
      metaDeps.clear();
    }
  }

  const targetValue = toValue(target) || (typeof window !== 'undefined' ? window : null);
  const cleanupFns = [
    useEventListener(
      targetValue,
      'keydown',
      (e: KeyboardEvent) => {
        updateRefs(e, true);
        return onEventFired(e);
      },
      { passive },
    ),
    useEventListener(
      targetValue,
      'keyup',
      (e: KeyboardEvent) => {
        updateRefs(e, false);
        return onEventFired(e);
      },
      { passive },
    ),
    useEventListener('blur', reset, { passive }),
    useEventListener('focus', reset, { passive }),
  ];

  const proxy = new Proxy(refs, {
    get(target, prop, rec) {
      if (typeof prop !== 'string') return Reflect.get(target, prop, rec);

      prop = prop.toLowerCase();
      // alias
      if (prop in aliasMap) prop = aliasMap[prop];
      // create new tracking
      if (!(prop in target)) {
        if (/[+_-]/.test(prop)) {
          const keys = prop.split(/[+_-]/g).map((i) => i.trim());
          target[prop] = computed(() =>
            keys.map((key) => toValue(proxy[key as string] as Signal<boolean>)).every(Boolean),
          );
        } else {
          target[prop] = signal(false);
        }
      }
      const r = Reflect.get(target, prop, rec);
      return useReactive ? (isSignal(r) ? r() : r) : r;
    },
  });

  return proxy as UseMagicKeysReturn<T>;
}

export { DefaultMagicKeysAliasMap } from './aliasMap';
