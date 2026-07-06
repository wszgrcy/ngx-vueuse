import { signal, afterNextRender, type Signal } from '@angular/core';
import { isClient } from '@cyia/ngx-vueuse/shared';
import { useDebounceFn } from '@cyia/ngx-vueuse/shared';
import { useEventListener } from '../useEventListener';

const topVarName = '--vueuse-safe-area-top';
const rightVarName = '--vueuse-safe-area-right';
const bottomVarName = '--vueuse-safe-area-bottom';
const leftVarName = '--vueuse-safe-area-left';

export interface UseScreenSafeAreaReturn {
  top: Signal<string>;
  right: Signal<string>;
  bottom: Signal<string>;
  left: Signal<string>;
  update: () => void;
}

/**
 * Reactive `env(safe-area-inset-*)`
 *
 * @see https://vueuse.org/useScreenSafeArea
 */
export function useScreenSafeArea(): UseScreenSafeAreaReturn {
  const top = signal('');
  const right = signal('');
  const bottom = signal('');
  const left = signal('');

  if (isClient) {
    document.documentElement.style.setProperty(topVarName, 'env(safe-area-inset-top, 0px)');
    document.documentElement.style.setProperty(rightVarName, 'env(safe-area-inset-right, 0px)');
    document.documentElement.style.setProperty(bottomVarName, 'env(safe-area-inset-bottom, 0px)');
    document.documentElement.style.setProperty(leftVarName, 'env(safe-area-inset-left, 0px)');

    afterNextRender(() => {
      update();
    });

    useEventListener('resize', useDebounceFn(update, 200), { passive: true });
  }

  function update() {
    top.set(getValue(topVarName));
    right.set(getValue(rightVarName));
    bottom.set(getValue(bottomVarName));
    left.set(getValue(leftVarName));
  }

  return {
    top,
    right,
    bottom,
    left,
    update,
  };
}

type VarName =
  | '--vueuse-safe-area-top'
  | '--vueuse-safe-area-right'
  | '--vueuse-safe-area-bottom'
  | '--vueuse-safe-area-left';

function getValue(position: VarName) {
  return getComputedStyle(document.documentElement).getPropertyValue(position);
}
