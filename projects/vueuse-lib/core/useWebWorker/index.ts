/** this implementation is original ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad */

import type { ConfigurableWindow } from '../_configurable';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { signal, type Signal } from '@angular/core';
import { defaultWindow } from '../_configurable';

type PostMessage = (typeof Worker.prototype)['postMessage'];

export interface UseWebWorkerReturn<Data = unknown> {
  data: Signal<Data | null>;
  post: PostMessage;
  terminate: () => void;
  worker: Signal<Worker | undefined>;
}

type WorkerFn = (...args: unknown[]) => Worker;

/**
 * Simple Web Workers registration and communication.
 *
 * @see https://vueuse.org/useWebWorker
 * @param url
 * @param workerOptions
 * @param options
 */
export function useWebWorker<Data = unknown>(
  url: string,
  workerOptions?: WorkerOptions,
  options?: ConfigurableWindow,
): UseWebWorkerReturn<Data>;

/**
 * Simple Web Workers registration and communication.
 *
 * @see https://vueuse.org/useWebWorker
 */
export function useWebWorker<Data = unknown>(worker: Worker | WorkerFn): UseWebWorkerReturn<Data>;

export function useWebWorker<Data = unknown>(
  arg0: string | WorkerFn | Worker,
  workerOptions?: WorkerOptions,
  options?: ConfigurableWindow,
): UseWebWorkerReturn<Data> {
  const { window = defaultWindow } = options ?? {};

  const data = signal<Data | null>(null);
  const worker = signal<Worker | undefined>(undefined);

  const post: PostMessage = (...args) => {
    const currentWorker = worker();
    if (!currentWorker) return;

    currentWorker.postMessage(...(args as Parameters<PostMessage>));
  };

  const terminate: (typeof Worker.prototype)['terminate'] = function terminate() {
    const currentWorker = worker();
    if (!currentWorker) return;

    currentWorker.terminate();
  };

  if (window) {
    if (typeof arg0 === 'string') worker.set(new Worker(arg0, workerOptions));
    else if (typeof arg0 === 'function') worker.set((arg0 as WorkerFn)());
    else worker.set(arg0);

    const currentWorker = worker();
    currentWorker!.onmessage = (e: MessageEvent) => {
      data.set(e.data);
    };

    tryOnScopeDispose(() => {
      const currentWorker = worker();
      if (currentWorker) currentWorker.terminate();
    });
  }

  return {
    data,
    post,
    terminate,
    worker,
  };
}
