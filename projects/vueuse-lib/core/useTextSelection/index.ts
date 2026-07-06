import type { Signal } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';

export interface UseTextSelectionOptions extends ConfigurableWindow {}

export interface UseTextSelectionReturn {
  text: Signal<string>;
  rects: Signal<DOMRect[]>;
  ranges: Signal<Range[]>;
  selection: Signal<Selection | null>;
}

function getRangesFromSelection(selection: Selection) {
  const rangeCount = selection.rangeCount ?? 0;
  return Array.from({ length: rangeCount }, (_, i) => selection.getRangeAt(i));
}

/**
 * Reactively track user text selection based on [`Window.getSelection`](https://developer.mozilla.org/en-US/docs/Web/API/Window/getSelection).
 *
 * @see https://vueuse.org/useTextSelection
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useTextSelection(options: UseTextSelectionOptions = {}): UseTextSelectionReturn {
  const { window = defaultWindow } = options;

  const selection = signal<Selection | null>(window?.getSelection() ?? null);
  const text = computed(() => selection()?.toString() ?? '');
  const ranges = computed<Range[]>(() => {
    const sel = selection();
    return sel ? getRangesFromSelection(sel) : [];
  });
  const rects = computed(() => ranges().map((range) => range.getBoundingClientRect()));

  function onSelectionChange() {
    selection.set(null); // trigger computed update
    if (window) selection.set(window.getSelection());
  }

  if (window)
    useEventListener(window.document, 'selectionchange', onSelectionChange, { passive: true });

  return {
    text,
    rects,
    ranges,
    selection,
  };
}
