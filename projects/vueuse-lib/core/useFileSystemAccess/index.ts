import type { Awaitable } from '@cyia/ngx-vueuse/shared';
import type { SignalOrGetter } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import { computed, effect, signal, type Signal } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { useSupported } from '../useSupported';
import { toRef } from '@cyia/ngx-vueuse/shared';

/**
 * window.showOpenFilePicker parameters
 * @see https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker#parameters
 */
export interface FileSystemAccessShowOpenFileOptions {
  multiple?: boolean;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

/**
 * window.showSaveFilePicker parameters
 * @see https://developer.mozilla.org/en-US/docs/Web/API/window/showSaveFilePicker#parameters
 */
export interface FileSystemAccessShowSaveFileOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
  excludeAcceptAllOption?: boolean;
}

/**
 * FileHandle
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
 */
export interface FileSystemFileHandle {
  getFile: () => Promise<File>;
  createWritable: () => FileSystemWritableFileStream;
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream
 */
interface FileSystemWritableFileStream extends WritableStream {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write
   */
  write: FileSystemWritableFileStreamWrite;
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/seek
   */
  seek: (position: number) => Promise<void>;
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/truncate
   */
  truncate: (size: number) => Promise<void>;
}

/**
 * FileStream.write
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write
 */
interface FileSystemWritableFileStreamWrite {
  (data: string | BufferSource | Blob): Promise<void>;
  (options: { type: 'write'; position: number; data: string | BufferSource | Blob }): Promise<void>;
  (options: { type: 'seek'; position: number }): Promise<void>;
  (options: { type: 'truncate'; size: number }): Promise<void>;
}

/**
 * FileStream.write
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/write
 */
export type FileSystemAccessWindow = Window & {
  showSaveFilePicker: (
    options: FileSystemAccessShowSaveFileOptions,
  ) => Promise<FileSystemFileHandle>;
  showOpenFilePicker: (
    options: FileSystemAccessShowOpenFileOptions,
  ) => Promise<FileSystemFileHandle[]>;
};

export type UseFileSystemAccessCommonOptions = Pick<
  FileSystemAccessShowOpenFileOptions,
  'types' | 'excludeAcceptAllOption'
>;
export type UseFileSystemAccessShowSaveFileOptions = Pick<
  FileSystemAccessShowSaveFileOptions,
  'suggestedName'
>;

export type UseFileSystemAccessOptions = ConfigurableWindow &
  UseFileSystemAccessCommonOptions & {
    /**
     * file data type
     */
    dataType?: SignalOrGetter<'Text' | 'ArrayBuffer' | 'Blob'>;
  };

/**
 * Create and read and write local files.
 * @see https://vueuse.org/useFileSystemAccess
 */
export function useFileSystemAccess(): UseFileSystemAccessReturn<string | ArrayBuffer | Blob>;
export function useFileSystemAccess(
  options: UseFileSystemAccessOptions & { dataType: 'Text' },
): UseFileSystemAccessReturn<string>;
export function useFileSystemAccess(
  options: UseFileSystemAccessOptions & { dataType: 'ArrayBuffer' },
): UseFileSystemAccessReturn<ArrayBuffer>;
export function useFileSystemAccess(
  options: UseFileSystemAccessOptions & { dataType: 'Blob' },
): UseFileSystemAccessReturn<Blob>;
export function useFileSystemAccess(
  options: UseFileSystemAccessOptions = {},
): UseFileSystemAccessReturn<string | ArrayBuffer | Blob> {
  const { window: _window = defaultWindow, dataType = 'Text' } = options;

  const window = _window as FileSystemAccessWindow;
  const isSupported = useSupported(
    () => window && 'showSaveFilePicker' in window && 'showOpenFilePicker' in window,
  );

  const fileHandle = signal<FileSystemFileHandle | undefined>(undefined);
  const data = signal<string | ArrayBuffer | Blob | undefined>(undefined);

  const file = signal<File | undefined>(undefined);
  const fileName = computed(() => file()?.name ?? '');
  const fileMIME = computed(() => file()?.type ?? '');
  const fileSize = computed(() => file()?.size ?? 0);
  const fileLastModified = computed(() => file()?.lastModified ?? 0);

  async function open(_options: UseFileSystemAccessCommonOptions = {}) {
    if (!isSupported()) return;
    const [handle] = await window.showOpenFilePicker({ ...toValue(options), ..._options });
    fileHandle.set(handle);
    await updateData();
  }

  async function create(_options: UseFileSystemAccessShowSaveFileOptions = {}) {
    if (!isSupported()) return;
    fileHandle.set(
      await (window as FileSystemAccessWindow).showSaveFilePicker({ ...options, ..._options }),
    );
    data.set(undefined);
    await updateData();
  }

  async function save(_options: UseFileSystemAccessShowSaveFileOptions = {}) {
    if (!isSupported()) return;

    if (!fileHandle())
      // save as
      return saveAs(_options);

    if (data()) {
      const writableStream = await fileHandle()!.createWritable();
      await writableStream.write(data()!);
      await writableStream.close();
    }
    await updateFile();
  }

  async function saveAs(_options: UseFileSystemAccessShowSaveFileOptions = {}) {
    if (!isSupported()) return;

    fileHandle.set(
      await (window as FileSystemAccessWindow).showSaveFilePicker({ ...options, ..._options }),
    );

    if (data()) {
      const writableStream = await fileHandle()!.createWritable();
      await writableStream.write(data()!);
      await writableStream.close();
    }

    await updateFile();
  }

  async function updateFile() {
    file.set(await fileHandle()?.getFile());
  }

  async function updateData() {
    await updateFile();
    const type = toValue(dataType);
    if (type === 'Text') data.set(await file()?.text());
    else if (type === 'ArrayBuffer') data.set(await file()?.arrayBuffer());
    else if (type === 'Blob') data.set(file());
  }

  // Watch for dataType changes and update data accordingly
  const dataTypeRef = toRef(dataType);
  effect(() => {
    updateData();
  });

  return {
    isSupported,
    data,
    file,
    fileName,
    fileMIME,
    fileSize,
    fileLastModified,
    open,
    create,
    save,
    saveAs,
    updateData,
  };
}

export interface UseFileSystemAccessReturn<T = string> extends Supportable {
  data: Signal<string | ArrayBuffer | Blob | undefined>;
  file: Signal<File | undefined>;
  fileName: Signal<string>;
  fileMIME: Signal<string>;
  fileSize: Signal<number>;
  fileLastModified: Signal<number>;
  open: (_options?: UseFileSystemAccessCommonOptions) => Awaitable<void>;
  create: (_options?: UseFileSystemAccessShowSaveFileOptions) => Awaitable<void>;
  save: (_options?: UseFileSystemAccessShowSaveFileOptions) => Awaitable<void>;
  saveAs: (_options?: UseFileSystemAccessShowSaveFileOptions) => Awaitable<void>;
  updateData: () => Awaitable<void>;
}
