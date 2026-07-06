import type { MaybeElementRef } from '../unrefElement';
import { unrefElement } from '../unrefElement';
import { useMutationObserver } from '../useMutationObserver';
import {
  ConfigurableDocumentOrShadowRoot,
  ConfigurableWindow,
  defaultWindow,
} from '../_configurable';
import { syncEffect } from '@cyia/ngx-vueuse/patch';
import { untracked } from '@angular/core';
import type { Fn } from '@cyia/ngx-vueuse/shared';

export interface OnElementRemovalOptions
  extends ConfigurableWindow, ConfigurableDocumentOrShadowRoot {}

/**
 * Fires when the element or any element containing it is removed.
 *
 * @param target
 * @param callback
 * @param options
 */
export function onElementRemoval(
  target: MaybeElementRef,
  callback: (mutationsList: MutationRecord[]) => void,
  options: OnElementRemovalOptions = {},
): Fn {
  const { window = defaultWindow, document = window?.document } = options;

  // SSR
  if (!window || !document) {
    return () => {};
  }

  let stopFn: Fn | undefined;
  const cleanupAndUpdate = (fn?: Fn) => {
    stopFn?.();
    stopFn = fn;
  };

  // Use syncEffect to reactively track the target (equivalent to watchEffect in Vue)
  const stopEffect = syncEffect(() => {
    const el = unrefElement(target as MaybeElementRef);
    if (el) {
      // Use untracked to avoid nested effect context issues
      const { stop } = untracked(() =>
        useMutationObserver(
          document as any,
          (mutationsList) => {
            const targetRemoved = mutationsList
              .map((mutation) => [...mutation.removedNodes])
              .flat()
              .some((node) => node === el || node.contains(el));

            if (targetRemoved) {
              callback(mutationsList);
            }
          },
          {
            window,
            childList: true,
            subtree: true,
          },
        ),
      );

      cleanupAndUpdate(stop);
    }
  });

  const stopHandle = () => {
    stopEffect.destroy();
    cleanupAndUpdate();
  };

  return stopHandle;
}
