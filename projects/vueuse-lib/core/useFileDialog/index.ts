import type { EventHookOn } from '@cyia/ngx-vueuse/shared';
import type { Signal } from '@angular/core';
import type { ConfigurableDocument } from '../_configurable';
import type { MaybeElementRef } from '../unrefElement';
import { createEventHook } from '@cyia/ngx-vueuse/shared';
import { signal, untracked } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { defaultDocument } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { toValue } from '@cyia/ngx-vueuse/shared';

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export type MaybeSignalOrValue<T> = Signal<T> | T;

export interface UseFileDialogOptions extends ConfigurableDocument {
  /**
   * @default true
   */
  multiple?: MaybeSignalOrValue<boolean>;
  /**
   * @default '*'
   */
  accept?: MaybeSignalOrValue<string>;
  /**
   * Select the input source for the capture file.
   * @see [HTMLInputElement Capture](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/capture)
   */
  capture?: MaybeSignalOrValue<string>;
  /**
   * Reset when open file dialog.
   * @default false
   */
  reset?: MaybeSignalOrValue<boolean>;
  /**
   * Select directories instead of files.
   * @see [HTMLInputElement webkitdirectory](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory)
   * @default false
   */
  directory?: MaybeSignalOrValue<boolean>;

  /**
   * Initial files to set.
   * @default null
   */
  initialFiles?: Array<File> | FileList;

  /**
   * The input element to use for file dialog.
   * @default document.createElement('input')
   */
  input?: MaybeElementRef<HTMLInputElement>;
}

const DEFAULT_OPTIONS: UseFileDialogOptions = {
  multiple: true,
  accept: '*',
  reset: false,
  directory: false,
};

export interface UseFileDialogReturn {
  files: Signal<FileList | null>;
  open: (localOptions?: Partial<UseFileDialogOptions>) => void;
  reset: () => void;
  onChange: EventHookOn<FileList | null>;
  onCancel: EventHookOn;
}

function prepareInitialFiles(files: UseFileDialogOptions['initialFiles']): FileList | null {
  if (!files) return null;

  if (files instanceof FileList) return files;

  const dt = new DataTransfer();
  for (const file of files) {
    dt.items.add(file);
  }

  return dt.files;
}

/**
 * Open file dialog with ease.
 *
 * @see https://vueuse.org/useFileDialog
 * @param options
 */
export function useFileDialog(options: UseFileDialogOptions = {}): UseFileDialogReturn {
  const { document: doc = defaultDocument } = options;

  const files = signal<FileList | null>(prepareInitialFiles(options.initialFiles));
  const { on: onChange, trigger: changeTrigger } = createEventHook();
  const { on: onCancel, trigger: cancelTrigger } = createEventHook();

  let inputEl: HTMLInputElement | undefined;

  const getInput = () => {
    if (!inputEl) {
      const input = unrefElement(options.input) ?? (doc ? doc.createElement('input') : undefined);
      if (input) {
        input.type = 'file';

        input.onchange = (event: Event) => {
          const result = event.target as HTMLInputElement;
          untracked(() => {
            files.set(result.files);
          });
          changeTrigger(files());
        };

        input.oncancel = () => {
          cancelTrigger();
        };
      }
      inputEl = input as HTMLInputElement;
    }
    return inputEl;
  };

  const reset = () => {
    untracked(() => {
      files.set(null);
    });
    const el = getInput();
    if (el && el.value) {
      el.value = '';
      changeTrigger(null);
    }
  };

  const applyOptions = (opts: UseFileDialogOptions) => {
    const el = getInput();
    if (!el) return;
    el.multiple = toValue(opts.multiple)!;
    el.accept = toValue(opts.accept)!;
    // webkitdirectory key is not stabled, maybe replaced in the future.
    el.webkitdirectory = toValue(opts.directory)!;
    if (hasOwn(opts, 'capture')) el.capture = toValue(opts.capture)!;
  };

  const open = (localOptions?: Partial<UseFileDialogOptions>) => {
    const el = getInput();
    if (!el) return;
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      ...localOptions,
    };
    applyOptions(mergedOptions);
    if (toValue(mergedOptions.reset)) reset();
    el.click();
  };

  // Watch for options changes (equivalent to Vue's watchEffect)
  const cleanup = watch(
    () => toValue(options),
    () => {
      applyOptions(options);
    },
    { immediate: true },
  );

  return {
    files: files as Signal<FileList | null>,
    open,
    reset,
    onCancel,
    onChange,
  };
}
