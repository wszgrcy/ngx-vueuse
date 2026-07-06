import { noop } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import type { Signal } from '@cyia/ngx-vueuse/shared';

export type UseAsyncQueueTask<T> = (...args: any[]) => T | Promise<T>;

type MapQueueTask<T extends any[]> = {
  [K in keyof T]: UseAsyncQueueTask<T[K]>;
};
export interface UseAsyncQueueResult<T> {
  state: 'aborted' | 'fulfilled' | 'pending' | 'rejected';
  data: T | null;
}

export interface UseAsyncQueueReturn<T> {
  activeIndex: Signal<number>;
  result: T;
}

export interface UseAsyncQueueOptions {
  /**
   * Interrupt tasks when current task fails.
   *
   * @default true
   */
  interrupt?: boolean;

  /**
   * Trigger it when the tasks fails.
   *
   */
  onError?: () => void;

  /**
   * Trigger it when the tasks ends.
   *
   */
  onFinished?: () => void;

  /**
   * A AbortSignal that can be used to abort the task.
   */
  signal?: AbortSignal;
}

/**
 * Asynchronous queue task controller.
 *
 * @see https://vueuse.org/useAsyncQueue
 * @param tasks
 * @param options
 */
export function useAsyncQueue<T extends any[], S = MapQueueTask<T>>(
  tasks: S & Array<UseAsyncQueueTask<any>>,
  options?: UseAsyncQueueOptions,
): UseAsyncQueueReturn<{ [P in keyof T]: UseAsyncQueueResult<T[P]> }> {
  const {
    interrupt = true,
    onError = noop,
    onFinished = noop,
    signal: abortSignal,
  } = options || {};

  const promiseState: Record<UseAsyncQueueResult<T>['state'], UseAsyncQueueResult<T>['state']> = {
    aborted: 'aborted',
    fulfilled: 'fulfilled',
    pending: 'pending',
    rejected: 'rejected',
  };

  const initialResult = Array.from(Array.from({ length: tasks.length }), () => ({
    state: promiseState.pending,
    data: null,
  }));

  // Use an array with mutable properties to simulate reactive behavior
  const result: { [P in keyof T]: UseAsyncQueueResult<T[P]> } = initialResult as any;

  const activeIndex = signal<number>(-1);

  if (!tasks || tasks.length === 0) {
    onFinished();
    return {
      activeIndex,
      result,
    };
  }

  function updateResult(state: UseAsyncQueueResult<T>['state'], res: unknown) {
    activeIndex.update((v) => v + 1);
    const idx = activeIndex();
    result[idx].data = res as T;
    result[idx].state = state;
  }

  tasks.reduce(
    (prev, curr) =>
      prev
        .then((prevRes) => {
          if (abortSignal?.aborted) {
            updateResult(promiseState.aborted, new Error('aborted'));
            return;
          }

          if (result[activeIndex()]?.state === promiseState.rejected && interrupt) {
            onFinished();
            return;
          }

          const done = curr(prevRes).then((currentRes: any) => {
            updateResult(promiseState.fulfilled, currentRes);
            if (activeIndex() === tasks.length - 1) onFinished();
            return currentRes;
          });

          if (!abortSignal) return done;

          return Promise.race([done, whenAborted(abortSignal)]);
        })
        .catch((e) => {
          if (abortSignal?.aborted) {
            updateResult(promiseState.aborted, e);
            return e;
          }

          updateResult(promiseState.rejected, e);
          onError();
          if (activeIndex() === tasks.length - 1) onFinished();
          return e;
        }),
    Promise.resolve(),
  );

  return {
    activeIndex,
    result,
  };
}

function whenAborted(signal: AbortSignal): Promise<never> {
  return new Promise((resolve, reject) => {
    const error = new Error('aborted');

    if (signal.aborted) reject(error);
    else signal.addEventListener('abort', () => reject(error), { once: true });
  });
}
