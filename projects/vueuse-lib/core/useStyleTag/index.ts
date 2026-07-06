import { Signal, WritableSignal, signal, afterNextRender, isSignal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';

import type { ConfigurableDocument } from '../_configurable';
import { defaultDocument } from '../_configurable';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { shallowReadonly } from '@cyia/ngx-vueuse/shared';

type MaybeRef<T> = T | Signal<T> | (() => T);

function toValue<T>(v: MaybeRef<T>): T {
  if (isSignal(v)) return v();
  if (typeof v === 'function') return (v as () => T)();
  return v;
}

export interface UseStyleTagOptions extends ConfigurableDocument {
  /**
   * Media query for styles to apply
   */
  media?: string;

  /**
   * Load the style immediately
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Manual controls the timing of loading and unloading
   *
   * @default false
   */
  manual?: boolean;

  /**
   * DOM id of the style tag
   *
   * @default auto-incremented
   */
  id?: string;

  /**
   * Nonce value for CSP (Content Security Policy)
   *
   * @default undefined
   */
  nonce?: string;
}

export interface UseStyleTagReturn {
  id: string;
  css: WritableSignal<string>;
  load: () => void;
  unload: () => void;
  isLoaded: Signal<boolean>;
}

let _id = 0;
const _refCount = new WeakMap<HTMLStyleElement, number>();

/**
 * Inject <style> element in head.
 *
 * Overload: Omitted id
 *
 * @see https://vueuse.org/useStyleTag
 * @param css
 * @param options
 */
export function useStyleTag(
  css: MaybeRef<string>,
  options: UseStyleTagOptions = {},
): UseStyleTagReturn {
  const isLoaded = signal(false);

  const {
    document: doc = defaultDocument,
    immediate = true,
    manual = false,
    id = `vueuse_styletag_${++_id}`,
  } = options;

  const cssRef = signal(toValue(css));

  let stop: (() => void) | null = null;
  const load = () => {
    if (!doc) return;

    const el = (doc.getElementById(id) || doc.createElement('style')) as HTMLStyleElement;

    if (!el.isConnected) {
      el.id = id;
      if (options.nonce) el.nonce = options.nonce;
      if (options.media) el.media = options.media;
      doc.head.appendChild(el);
    }

    if (isLoaded()) return;

    _refCount.set(el, (_refCount.get(el) ?? 0) + 1);

    stop = watch(
      cssRef,
      (value) => {
        el.textContent = value;
      },
      { immediate: true },
    ) as unknown as () => void;

    isLoaded.set(true);
  };

  const unload = () => {
    if (!doc || !isLoaded()) return;
    if (stop) stop();

    const el = doc.getElementById(id) as HTMLStyleElement | null;
    if (el) {
      const count = (_refCount.get(el) ?? 1) - 1;
      if (count <= 0) {
        _refCount.delete(el);
        doc.head.removeChild(el);
      } else {
        _refCount.set(el, count);
      }
    }

    isLoaded.set(false);
  };

  if (immediate && !manual) afterNextRender(load);

  tryOnScopeDispose(unload);

  return {
    id,
    css: cssRef,
    unload,
    load,
    isLoaded: shallowReadonly(isLoaded),
  };
}
