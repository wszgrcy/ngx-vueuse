/**
 * Reactive Clipboard API.
 *
 * @see https://vueuse.org/useClipboard
 * @param options
 *
 * @__NO_SIDE_EFFECTS__
 */

import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import type { MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';
import { useTimeoutFn } from '@cyia/ngx-vueuse/shared';
import { computed, signal, type Signal } from '@angular/core';
import { shallowReadonly } from '@cyia/ngx-vueuse/shared';
import { defaultNavigator } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { usePermission } from '../usePermission';
import { useSupported } from '../useSupported';
import { toValue } from '@cyia/ngx-vueuse/shared';

export interface UseClipboardOptions<Source> extends ConfigurableNavigator {
  /**
   * Enabled reading for clipboard
   *
   * @default false
   */
  read?: boolean;

  /**
   * Copy source
   */
  source?: Source;

  /**
   * Milliseconds to reset state of `copied` ref
   *
   * @default 1500
   */
  copiedDuring?: number;

  /**
   * Whether fallback to document.execCommand('copy') if clipboard is undefined.
   *
   * @default false
   */
  legacy?: boolean;
}

type ClipboardValue = string | (() => Promise<string | undefined>);

export interface UseClipboardReturn<Optional> extends Supportable {
  text: Signal<string>;
  copied: Signal<boolean>;
  copyPending: Signal<boolean>;
  copy: Optional extends true
    ? (text?: ClipboardValue) => Promise<void>
    : (text: ClipboardValue) => Promise<void>;
}

export function useClipboard(options?: UseClipboardOptions<undefined>): UseClipboardReturn<false>;
export function useClipboard(
  options: UseClipboardOptions<MaybeRefOrGetter<string>>,
): UseClipboardReturn<true>;
export function useClipboard(
  options: UseClipboardOptions<MaybeRefOrGetter<string> | undefined> = {},
): UseClipboardReturn<boolean> {
  const {
    navigator = defaultNavigator,
    read = false,
    source,
    copiedDuring = 1500,
    legacy = false,
  } = options;

  const isClipboardApiSupported = useSupported(() => navigator && 'clipboard' in navigator);
  const permissionRead = usePermission('clipboard-read');
  const permissionWrite = usePermission('clipboard-write');
  const isSupported = computed(() => isClipboardApiSupported() || legacy);
  const text = signal('');
  const copied = signal(false);
  const copyPending = signal(false);
  const timeout = useTimeoutFn(() => copied.set(false), copiedDuring, { immediate: false });
  let lastLegacyId = 0;

  async function updateText() {
    let useLegacy = !(isClipboardApiSupported() && isAllowed(permissionRead()));
    if (!useLegacy) {
      try {
        text.set(await navigator!.clipboard.readText());
      } catch {
        useLegacy = true;
      }
    }
    if (useLegacy) {
      text.set(legacyRead());
    }
  }

  if (isSupported() && read) useEventListener(['copy', 'cut'], updateText, { passive: true });

  async function copy(value?: ClipboardValue) {
    const resolvedValue = value ?? toValue(source);
    if (isSupported() && resolvedValue != null) {
      copyPending.set(true);
      let useLegacy = !(isClipboardApiSupported() && isAllowed(permissionWrite()));

      if (!useLegacy) {
        try {
          const clipboardItem = createClipboardItem(resolvedValue);
          await navigator!.clipboard.write([clipboardItem]);
        } catch {
          useLegacy = true;
        }
      }

      if (useLegacy) {
        if (typeof resolvedValue === 'string') {
          text.set(resolvedValue);
          legacyCopy(resolvedValue);
        } else {
          // For async functions in legacy mode, resolve and copy
          const currentId = ++lastLegacyId;
          const resolvedText = await resolvedValue();
          if (resolvedText != null && currentId === lastLegacyId) {
            text.set(resolvedText);
            legacyCopy(resolvedText);
          }
        }
      }

      copied.set(true);
      timeout.start();
      copyPending.set(false);
    }
  }

  function createClipboardItem(value: ClipboardValue): ClipboardItem {
    if (typeof value === 'string') {
      text.set(value);
      return new ClipboardItem({ 'text/plain': value });
    } else {
      return new ClipboardItem({
        'text/plain': value().then((resolvedText = '') => {
          text.set(resolvedText);
          return new Blob([resolvedText], { type: 'text/plain' });
        }),
      });
    }
  }

  function legacyCopy(value: string) {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'absolute';
    ta.style.opacity = '0';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  function legacyRead() {
    return document?.getSelection?.()?.toString() ?? '';
  }

  function isAllowed(status: PermissionState | undefined) {
    return status === 'granted' || status === 'prompt';
  }

  return {
    copyPending: shallowReadonly(copyPending),
    isSupported,
    text: shallowReadonly(text),
    copied: shallowReadonly(copied),
    copy,
  };
}
