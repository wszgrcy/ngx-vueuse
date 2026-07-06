import type { Fn } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import { toRef } from '@cyia/ngx-vueuse/shared';
import { signal, afterNextRender, type Signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { useResizeObserver } from '../useResizeObserver';
import { toValue as toValueFn } from '@cyia/ngx-vueuse/shared';
import { watch } from '@cyia/ngx-vueuse/patch';

type SignalOrGetter<T> = Signal<T> | T | (() => T);
type MaybeRefOrGetter<T> = SignalOrGetter<T>;

export interface UseTextareaAutosizeOptions extends ConfigurableWindow {
  /** Textarea element to autosize. */
  element?: MaybeRefOrGetter<HTMLTextAreaElement | undefined | null>;
  /** Textarea content. */
  input?: MaybeRefOrGetter<string>;
  /** Maximum autosized height in pixels. */
  maxHeight?: number;
  /** Watch sources that should trigger a textarea resize. */
  watch?: (() => unknown) | (() => unknown)[];
  /** Function called when the textarea size changes. */
  onResize?: () => void;
  /** Specify style target to apply the height based on textarea content. If not provided it will use textarea it self.  */
  styleTarget?: MaybeRefOrGetter<HTMLElement | undefined>;
  /** Specify the style property that will be used to manipulate height. Can be `height | minHeight`. Default value is `height`. */
  styleProp?: 'height' | 'minHeight';
}

export interface UseTextareaAutosizeReturn {
  textarea: Signal<HTMLTextAreaElement | undefined | null>;
  input: Signal<string>;
  triggerResize: () => void;
}

/**
 * Call window.requestAnimationFrame(), if not available, just call the function
 *
 * @param window
 * @param fn
 */
function tryRequestAnimationFrame(window: Window | undefined = defaultWindow, fn: Fn) {
  if (window && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(fn);
  } else {
    fn();
  }
}

export function useTextareaAutosize(
  options: UseTextareaAutosizeOptions = {},
): UseTextareaAutosizeReturn {
  const { window = defaultWindow } = options;
  const textarea = toRef(options?.element);
  const input = toRef(options?.input ?? '');
  const styleProp = options?.styleProp ?? 'height';
  const textareaScrollHeight = signal(1);
  const textareaOldWidth = signal(0);

  function triggerResize() {
    const ta = textarea();
    if (!ta) return;

    let height = '';
    const maxHeight = options?.maxHeight;

    const el = ta as unknown as HTMLTextAreaElement;
    el.style[styleProp] = '1px';
    textareaScrollHeight.set(el?.scrollHeight ?? 1);
    const styleTarget = toValueFn(options?.styleTarget);
    const styleHeight =
      maxHeight != null
        ? `${Math.min(textareaScrollHeight(), maxHeight)}px`
        : `${textareaScrollHeight()}px`;

    // If style target is provided update its height
    if (styleTarget) styleTarget.style[styleProp] = styleHeight;
    // else update textarea's height by updating height variable
    else height = styleHeight;

    el.style[styleProp] = height;
  }

  afterNextRender(() => {
    triggerResize();
  });

  watch([input, textarea], triggerResize, { immediate: true });

  watch(textareaScrollHeight, () => options?.onResize?.());

  useResizeObserver(textarea as any, ([{ contentRect }]) => {
    if (textareaOldWidth() === contentRect.width) return;

    tryRequestAnimationFrame(window, () => {
      textareaOldWidth.set(contentRect.width);
      triggerResize();
    });
  });

  if (options?.watch) {
    const watchSources = options.watch;
    watch(Array.isArray(watchSources) ? watchSources : [watchSources], triggerResize, {
      immediate: true,
    });
  }

  return {
    textarea: textarea as Signal<HTMLTextAreaElement | undefined | null>,
    input: input as Signal<string>,
    triggerResize,
  };
}
