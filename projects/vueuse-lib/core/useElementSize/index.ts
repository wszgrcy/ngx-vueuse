import type { Signal } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { UseResizeObserverOptions } from '../useResizeObserver';
import { defaultWindow } from '../_configurable';
import { unrefElement, type MaybeComputedElementRef } from '../unrefElement';
import { useResizeObserver } from '../useResizeObserver';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';
import { toValue } from '@cyia/ngx-vueuse/shared';

export interface ElementSize {
  width: number;
  height: number;
}

export interface UseElementSizeOptions extends UseResizeObserverOptions {
  box?: 'content-box' | 'border-box' | 'device-pixel-content-box';
}

export interface UseElementSizeReturn {
  width: Signal<number>;
  height: Signal<number>;
  stop: () => void;
}

/**
 * Reactive size of an HTML element.
 *
 * @see https://vueuse.org/useElementSize
 */
export function useElementSize(
  target: MaybeComputedElementRef,
  initialSize: ElementSize = { width: 0, height: 0 },
  options: UseElementSizeOptions = {},
): UseElementSizeReturn {
  const { window: win = defaultWindow, box = 'content-box' } = options;
  const isSVG = computed(() => {
    const elem = toValue(target) as HTMLElement | SVGElement | undefined;
    return elem?.namespaceURI?.includes('svg') ?? false;
  });
  const width = signal(initialSize.width);
  const height = signal(initialSize.height);

  const { stop: stop1 } = useResizeObserver(
    target,
    ([entry]) => {
      const boxSize =
        box === 'border-box'
          ? entry.borderBoxSize
          : box === 'content-box'
            ? entry.contentBoxSize
            : entry.devicePixelContentBoxSize;

      if (win && isSVG()) {
        const $elem = unrefElement(toValue(target));
        if ($elem) {
          const rect = $elem.getBoundingClientRect();
          width.set(rect.width);
          height.set(rect.height);
        }
      } else {
        if (boxSize) {
          const formatBoxSize: ResizeObserverSize[] = Array.isArray(boxSize)
            ? [...boxSize]
            : [boxSize];
          width.set(formatBoxSize.reduce((acc, { inlineSize }) => acc + inlineSize, 0));
          height.set(formatBoxSize.reduce((acc, { blockSize }) => acc + blockSize, 0));
        } else {
          // fallback
          width.set(entry.contentRect.width);
          height.set(entry.contentRect.height);
        }
      }
    },
    options,
  );

  tryOnMounted(() => {
    const ele = unrefElement(toValue(target));
    if (ele) {
      width.set('offsetWidth' in ele ? ele.offsetWidth : initialSize.width);
      height.set('offsetHeight' in ele ? ele.offsetHeight : initialSize.height);
    }
  });

  const stop2 = watch(
    () => unrefElement(toValue(target)),
    () => {
      const ele = unrefElement(toValue(target));
      width.set(ele ? ('offsetWidth' in ele ? ele.offsetWidth : initialSize.width) : 0);
      height.set(ele ? ('offsetHeight' in ele ? ele.offsetHeight : initialSize.height) : 0);
    },
    { immediate: true },
  );

  function stop() {
    stop1();
    stop2();
  }

  return {
    width,
    height,
    stop,
  };
}
