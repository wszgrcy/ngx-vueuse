import { noop, promiseTimeout, toValue } from '@cyia/ngx-vueuse/shared';
import { signal } from '@angular/core';
import type { Signal } from '@cyia/ngx-vueuse/shared';

export interface UseAsyncStateReturnBase<Data, Params extends any[], Shallow extends boolean> {
  state: Shallow extends true ? Signal<Data> : Signal<UnwrapRef<Data>>;
  isReady: Signal<boolean>;
  isLoading: Signal<boolean>;
  error: Signal<unknown>;
  execute: (delay?: number, ...args: Params) => Promise<Data | undefined>;
  executeImmediate: (...args: Params) => Promise<Data | undefined>;
}

export type UseAsyncStateReturn<
  Data,
  Params extends any[],
  Shallow extends boolean,
> = UseAsyncStateReturnBase<Data, Params, Shallow> &
  PromiseLike<UseAsyncStateReturnBase<Data, Params, Shallow>>;

export interface UseAsyncStateOptions<Shallow extends boolean, D = any> {
  /**
   * Delay for the first execution of the promise when "immediate" is true. In milliseconds.
   *
   * @default 0
   */
  delay?: number;

  /**
   * Execute the promise right after the function is invoked.
   * Will apply the delay if any.
   *
   * When set to false, you will need to execute it manually.
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Callback when error is caught.
   */
  onError?: (e: unknown) => void;

  /**
   * Callback when success is caught.
   * @param {D} data
   */
  onSuccess?: (data: D) => void;

  /**
   * Sets the state to initialState before executing the promise.
   *
   * This can be useful when calling the execute function more than once (for
   * example, to refresh data). When set to false, the current state remains
   * unchanged until the promise resolves.
   *
   * @default true
   */
  resetOnExecute?: boolean;

  /**
   * Use shallow ref.
   *
   * @default true
   */
  shallow?: Shallow;
  /**
   *
   * An error is thrown when executing the execute function
   *
   * @default false
   */
  throwError?: boolean;
}

/**
 * Helper to recursively unwrap Signal types (analogous to Vue's UnwrapRef).
 */
type UnwrapRef<T> = T extends Signal<infer U> ? U : T;

/**
 * Reactive async state. Will not block your setup function and will trigger changes once
 * the promise is ready.
 *
 * @see https://vueuse.org/useAsyncState
 * @param promise         The promise / async function to be resolved
 * @param initialState    The initial state, used until the first evaluation finishes
 * @param options
 */
export function useAsyncState<Data, Params extends any[] = any[], Shallow extends boolean = true>(
  promise: Promise<Data> | ((...args: Params) => Promise<Data>),
  initialState: Signal<Data> | Data,
  options?: UseAsyncStateOptions<Shallow, Data>,
): UseAsyncStateReturn<Data, Params, Shallow> {
  const {
    immediate = true,
    delay = 0,
    onError = globalThis.reportError ?? noop,
    onSuccess = noop,
    resetOnExecute = true,
    shallow = true,
    throwError,
  } = options ?? {};

  const state = shallow ? signal(initialState as Data) : signal(toValue(initialState) as Data);

  const isReady = signal(false);
  const isLoading = signal(false);
  const error = signal<unknown | undefined>(undefined);

  let executionsCount = 0;
  async function execute(delay = 0, ...args: any[]) {
    const executionId = (executionsCount += 1);

    if (resetOnExecute) state.set(toValue(initialState) as Data);
    error.set(undefined);
    isReady.set(false);
    isLoading.set(true);

    if (delay > 0) await promiseTimeout(delay);

    const _promise = typeof promise === 'function' ? promise(...(args as Params)) : promise;

    try {
      const data = await _promise;
      if (executionId === executionsCount) {
        state.set(data);
        isReady.set(true);
      }
      onSuccess(data);
      return data;
    } catch (e) {
      if (executionId === executionsCount) error.set(e);
      onError(e);
      if (throwError) throw e;
      return undefined;
    } finally {
      if (executionId === executionsCount) isLoading.set(false);
    }
  }

  if (immediate) {
    execute(delay);
  }

  const shell = {
    state: state as unknown as Shallow extends true ? Signal<Data> : Signal<UnwrapRef<Data>>,
    isReady,
    isLoading,
    error,
    execute,
    executeImmediate: (...args: any[]) => execute(0, ...args),
  };

  function waitUntilIsLoaded() {
    return new Promise<UseAsyncStateReturnBase<Data, Params, Shallow>>((resolve) => {
      resolve(shell);
    });
  }

  return {
    ...shell,
    then(onFulfilled, onRejected) {
      return waitUntilIsLoaded().then(onFulfilled, onRejected);
    },
  };
}

type SignalOrWritable<T> = { (): T; set: (v: T) => void };
