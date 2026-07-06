import type { Signal } from '@angular/core';
import type { UseClipboardItemsOptions, UseClipboardItemsReturn } from './types';
import { useTimeoutFn } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultNavigator } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';
import { signal } from '@angular/core';
import { shallowReadonly } from '@cyia/ngx-vueuse/shared';

export function useClipboardItems(
  options?: UseClipboardItemsOptions<undefined>,
): UseClipboardItemsReturn<false>;
export function useClipboardItems(
  options: UseClipboardItemsOptions<Signal<ClipboardItems> | ClipboardItems>,
): UseClipboardItemsReturn<true>;
export function useClipboardItems(
  options: UseClipboardItemsOptions<Signal<ClipboardItems> | ClipboardItems | undefined> = {},
): UseClipboardItemsReturn<boolean> {
  const { navigator = defaultNavigator, read = false, source, copiedDuring = 1500 } = options;

  const isSupported = useSupported(() => navigator && 'clipboard' in navigator);
  const content = signal<ClipboardItems>([]);
  const copied = signal(false);
  const timeout = useTimeoutFn(() => copied.set(false), copiedDuring, { immediate: false });

  function updateContent() {
    if (isSupported()) {
      navigator!.clipboard.read().then((items) => {
        content.set(items);
      });
    }
  }

  if (isSupported() && read) {
    useEventListener(['copy', 'cut'], updateContent, { passive: true });
  }

  async function copy(value = toValue(source)) {
    if (isSupported() && value != null) {
      await navigator!.clipboard.write(value);

      content.set(value);
      copied.set(true);
      timeout.start();
    }
  }

  return {
    isSupported,
    content: shallowReadonly(content),
    copied: shallowReadonly(copied),
    copy,
    read: updateContent,
  };
}
