import { isClient } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import type { Signal } from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { getDefaultSerialization } from './serialization';
import { watch } from '@cyia/ngx-vueuse/patch';

type MaybeRefOrGetter<T> = Signal<T> | T | (() => T);

export interface UseBase64Options {
  /**
   * Output as Data URL format
   *
   * @default true
   */
  dataUrl?: boolean;
}

export interface ToDataURLOptions extends UseBase64Options {
  /**
   * MIME type
   */
  type?: string | undefined;
  /**
   * Image quality of jpeg or webp
   */
  quality?: any;
}

export interface UseBase64ObjectOptions<T> extends UseBase64Options {
  serializer?: (v: T) => string;
}

export interface UseBase64Return {
  base64: Signal<string>;
  promise: Signal<Promise<string> | undefined>;
  execute: () => Promise<string> | undefined;
}


export function useBase64(
  target: MaybeRefOrGetter<string | undefined>,
  options?: UseBase64Options,
): UseBase64Return;

export function useBase64(
  target: MaybeRefOrGetter<Blob | undefined>,
  options?: UseBase64Options,
): UseBase64Return;

export function useBase64(
  target: MaybeRefOrGetter<ArrayBuffer | undefined>,
  options?: UseBase64Options,
): UseBase64Return;

export function useBase64(
  target: MaybeRefOrGetter<HTMLCanvasElement | undefined>,
  options?: ToDataURLOptions,
): UseBase64Return;

export function useBase64(
  target: MaybeRefOrGetter<HTMLImageElement | undefined>,
  options?: ToDataURLOptions,
): UseBase64Return;

export function useBase64<T extends Record<string, unknown>>(
  target: MaybeRefOrGetter<T>,
  options?: UseBase64ObjectOptions<T>,
): UseBase64Return;

export function useBase64<T extends Map<string, unknown>>(
  target: MaybeRefOrGetter<T>,
  options?: UseBase64ObjectOptions<T>,
): UseBase64Return;

export function useBase64<T extends Set<unknown>>(
  target: MaybeRefOrGetter<T>,
  options?: UseBase64ObjectOptions<T>,
): UseBase64Return;

export function useBase64<T extends unknown[]>(
  target: MaybeRefOrGetter<T>,
  options?: UseBase64ObjectOptions<T>,
): UseBase64Return;

export function useBase64(target: any, options?: any): UseBase64Return {
  const base64 = signal('');
  const promise = signal<Promise<string> | undefined>(undefined);

  function execute() {
    if (!isClient) return;

    promise.set(
      new Promise<string>((resolve, reject) => {
        try {
          const _target = toValue(target);
          if (_target == null) {
            resolve('');
          } else if (typeof _target === 'string') {
            resolve(blobToBase64(new Blob([_target], { type: 'text/plain' })));
          } else if (_target instanceof Blob) {
            resolve(blobToBase64(_target));
          } else if (_target instanceof ArrayBuffer) {
            resolve(window.btoa(String.fromCharCode(...new Uint8Array(_target))));
          } else if (_target instanceof HTMLCanvasElement) {
            resolve(_target.toDataURL(options?.type, options?.quality));
          } else if (_target instanceof HTMLImageElement) {
            const img = _target.cloneNode(false) as HTMLImageElement;
            img.crossOrigin = 'Anonymous';
            imgLoaded(img)
              .then(() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL(options?.type, options?.quality));
              })
              .catch(reject);
          } else if (typeof _target === 'object') {
            const _serializeFn = options?.serializer || getDefaultSerialization(_target);

            const serialized = _serializeFn(_target);

            return resolve(blobToBase64(new Blob([serialized], { type: 'application/json' })));
          } else {
            reject(new Error('target is unsupported types'));
          }
        } catch (error) {
          reject(error);
        }
      }),
    );

    const p = promise()!;
    p.then((res) => {
      base64.set(options?.dataUrl === false ? res.replace(/^data:.*?;base64,/, '') : res);
    });
    return p;
  }

  if (typeof target === 'function' || (typeof target === 'object' && 'set' in target)) {
    watch(target, execute, { immediate: true });
    return {
      base64,
      promise,
      execute,
    };
  } else {
    execute();
    return {
      base64,
      promise,
      execute,
    };
  }
}

function imgLoaded(img: HTMLImageElement) {
  return new Promise<void>((resolve, reject) => {
    if (!img.complete) {
      img.onload = () => {
        resolve();
      };
      img.onerror = reject;
    } else {
      resolve();
    }
  });
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = (e) => {
      resolve(e.target!.result as string);
    };
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
