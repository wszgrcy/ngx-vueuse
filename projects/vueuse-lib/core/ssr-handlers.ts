// @ts-ignore global is defined in Node.js environments
declare const global: any;
import type { Awaitable } from '@cyia/ngx-vueuse/shared';
import type { MaybeElementRef } from './unrefElement';

export interface StorageLikeAsync {
  getItem: (key: string) => Awaitable<string | null>;
  setItem: (key: string, value: string) => Awaitable<void>;
  removeItem: (key: string) => Awaitable<void>;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/**
 * @experimental The API is not finalized yet. It might not follow semver.
 */
export interface SSRHandlersMap {
  getDefaultStorage: () => StorageLike | undefined;
  getDefaultStorageAsync: () => StorageLikeAsync | undefined;
  updateHTMLAttrs: (selector: string | MaybeElementRef, attribute: string, value: string) => void;
}

const _global: Record<string, unknown> =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
        ? global
        : typeof self !== 'undefined'
          ? self
          : {};

const globalKey = '__vueuse_ssr_handlers__';
const handlers = /* #__PURE__ */ getHandlers();

function getHandlers() {
  if (!(globalKey in _global)) (_global as any)[globalKey] = (_global as any)[globalKey] || {};
  return (_global as any)[globalKey] as Partial<SSRHandlersMap>;
}

export function getSSRHandler<T extends keyof SSRHandlersMap>(
  key: T,
  fallback: SSRHandlersMap[T],
): SSRHandlersMap[T];
export function getSSRHandler<T extends keyof SSRHandlersMap>(
  key: T,
  fallback?: SSRHandlersMap[T] | undefined,
): SSRHandlersMap[T] | undefined {
  return (handlers[key] as SSRHandlersMap[T]) || fallback;
}

export function setSSRHandler<T extends keyof SSRHandlersMap>(key: T, fn: SSRHandlersMap[T]) {
  handlers[key] = fn;
}
