import type { Fn, Stoppable } from '@cyia/ngx-vueuse/shared';
import type { SignalOrGetter, Signal } from '@cyia/ngx-vueuse/shared';
import type { EventHookOn } from '@cyia/ngx-vueuse/shared';
import { containsProp } from '@cyia/ngx-vueuse/shared';
import { createEventHook } from '@cyia/ngx-vueuse/shared';
import { computed, isSignal, signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { toRef } from '@cyia/ngx-vueuse/shared';
import { useTimeoutFn } from '@cyia/ngx-vueuse/shared';
import { watchDeep } from '@cyia/ngx-vueuse/shared';

export interface UseFetchReturn<T> {
  /**
   * Indicates if the fetch request has finished
   */
  isFinished: Signal<boolean>;

  /**
   * The statusCode of the HTTP fetch response
   */
  statusCode: Signal<number | null>;

  /**
   * The raw response of the fetch response
   */
  response: Signal<Response | null>;

  /**
   * Any fetch errors that may have occurred
   */
  error: Signal<unknown>;

  /**
   * The fetch response body on success, may either be JSON or text
   */
  data: Signal<T | null>;

  /**
   * Indicates if the request is currently being fetched.
   */
  isFetching: Signal<boolean>;

  /**
   * Indicates if the fetch request is able to be aborted
   */
  canAbort: Signal<boolean>;

  /**
   * Indicates if the fetch request was aborted
   */
  aborted: Signal<boolean>;

  /**
   * Abort the fetch request
   */
  abort: (reason?: unknown) => void;

  /**
   * Manually call the fetch
   * (default not throwing error)
   */
  execute: (throwOnFailed?: boolean) => Promise<unknown>;

  /**
   * Fires after the fetch request has finished
   */
  onFetchResponse: EventHookOn<Response>;

  /**
   * Fires after a fetch request error
   */
  onFetchError: EventHookOn;

  /**
   * Fires after a fetch has completed
   */
  onFetchFinally: EventHookOn;

  // methods
  get: () => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  post: (
    payload?: unknown,
    type?: string,
  ) => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  put: (
    payload?: unknown,
    type?: string,
  ) => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  delete: (
    payload?: unknown,
    type?: string,
  ) => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  patch: (
    payload?: unknown,
    type?: string,
  ) => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  head: (
    payload?: unknown,
    type?: string,
  ) => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  options: (
    payload?: unknown,
    type?: string,
  ) => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;

  // type
  json: () => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  text: () => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  blob: () => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  arrayBuffer: () => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
  formData: () => (UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>) | undefined;
}

type DataType = 'text' | 'json' | 'blob' | 'arrayBuffer' | 'formData';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type Combination = 'overwrite' | 'chain';

const payloadMapping: Record<string, string> = {
  json: 'application/json',
  text: 'text/plain',
};

export interface BeforeFetchContext {
  /**
   * The computed url of the current request
   */
  url: string;

  /**
   * The request options of the current request
   */
  options: RequestInit;

  /**
   * Cancels the current request
   */
  cancel: Fn;
}

export interface AfterFetchContext<T = unknown> {
  response: Response;

  data: T | null;

  context: BeforeFetchContext;

  execute: (throwOnFailed?: boolean) => Promise<unknown>;
}

export interface OnFetchErrorContext<T = unknown, E = unknown> {
  error: E;

  data: T | null;

  response: Response | null;

  context: BeforeFetchContext;

  execute: (throwOnFailed?: boolean) => Promise<unknown>;
}

export interface UseFetchOptions {
  /**
   * Fetch function
   */
  fetch?: typeof window.fetch;

  /**
   * Will automatically run fetch when `useFetch` is used
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Will automatically refetch when:
   * - the URL is changed if the URL is a signal
   * - the payload is changed if the payload is a signal
   *
   * @default false
   */
  refetch?: SignalOrGetter<boolean>;

  /**
   * Initial data before the request finished
   *
   * @default null
   */
  initialData?: unknown;

  /**
   * Timeout for abort request after number of millisecond
   * `0` means use browser default
   *
   * @default 0
   */
  timeout?: number;

  /**
   * Allow update the `data` ref when fetch error whenever provided, or mutated in the `onFetchError` callback
   *
   * @default false
   */
  updateDataOnError?: boolean;

  /**
   * Will run immediately before the fetch request is dispatched
   */
  beforeFetch?: (
    ctx: BeforeFetchContext,
  ) => Promise<Partial<BeforeFetchContext> | void> | Partial<BeforeFetchContext> | void;

  /**
   * Will run immediately after the fetch request is returned.
   * Runs after any 2xx response
   */
  afterFetch?: (
    ctx: AfterFetchContext,
  ) => Promise<Partial<AfterFetchContext>> | Partial<AfterFetchContext>;

  /**
   * Will run immediately after the fetch request is returned.
   * Runs after any 4xx and 5xx response
   */
  onFetchError?: (
    ctx: OnFetchErrorContext,
  ) => Promise<Partial<OnFetchErrorContext>> | Partial<OnFetchErrorContext>;
}

export interface CreateFetchOptions {
  /**
   * The base url that will be prefixed to all urls unless urls are absolute
   */
  baseUrl?: SignalOrGetter<string>;

  /**
   * Determine the inherit behavior for beforeFetch, afterFetch, onFetchError
   * @default 'chain'
   */
  combination?: Combination;

  /**
   * Default Options for the useFetch function
   */
  options?: UseFetchOptions;

  /**
   * Options for the fetch request
   */
  fetchOptions?: RequestInit;
}

/**
 * !!!IMPORTANT!!!
 *
 * If you update the UseFetchOptions interface, be sure to update this object
 * to include the new options
 */
function isFetchOptions(obj: object): obj is UseFetchOptions {
  return (
    obj &&
    containsProp(
      obj,
      'immediate',
      'refetch',
      'initialData',
      'timeout',
      'beforeFetch',
      'afterFetch',
      'onFetchError',
      'fetch',
      'updateDataOnError',
    )
  );
}

const reAbsolute = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;
// A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
function isAbsoluteURL(url: string) {
  return reAbsolute.test(url);
}

function headersToObject(headers: HeadersInit | undefined) {
  if (typeof Headers !== 'undefined' && headers instanceof Headers)
    return Object.fromEntries(headers.entries());
  return headers;
}

function combineCallbacks<T = unknown>(
  combination: Combination,
  ...callbacks: (((ctx: T) => void | Partial<T> | Promise<void | Partial<T>>) | undefined)[]
) {
  if (combination === 'overwrite') {
    // use last callback
    return async (ctx: T) => {
      let callback;
      for (let i = callbacks.length - 1; i >= 0; i--) {
        if (callbacks[i] != null) {
          callback = callbacks[i];
          break;
        }
      }
      if (callback) return { ...ctx, ...(await callback(ctx)) };

      return ctx;
    };
  } else {
    // chaining and combine result
    return async (ctx: T) => {
      for (const callback of callbacks) {
        if (callback) ctx = { ...ctx, ...(await callback(ctx)) };
      }

      return ctx;
    };
  }
}

export function createFetch(config: CreateFetchOptions = {}) {
  const _combination = config.combination || ('chain' as Combination);
  const _options = config.options || {};
  const _fetchOptions = config.fetchOptions || {};

  function useFactoryFetch(url: SignalOrGetter<string>, ...args: any[]) {
    const computedUrl = computed(() => {
      const baseUrl = toValue(config.baseUrl as SignalOrGetter<string> | undefined);
      const targetUrl = toValue(url);

      return baseUrl && !isAbsoluteURL(targetUrl) ? joinPaths(baseUrl, targetUrl) : targetUrl;
    });

    let options = _options;
    let fetchOptions = _fetchOptions;

    // Merge properties into a single object
    if (args.length > 0) {
      if (isFetchOptions(args[0])) {
        options = {
          ...options,
          ...args[0],
          beforeFetch: combineCallbacks(_combination, _options.beforeFetch, args[0].beforeFetch),
          afterFetch: combineCallbacks(_combination, _options.afterFetch, args[0].afterFetch),
          onFetchError: combineCallbacks(_combination, _options.onFetchError, args[0].onFetchError),
        };
      } else {
        fetchOptions = {
          ...fetchOptions,
          ...args[0],
          headers: {
            ...(headersToObject(fetchOptions.headers) || {}),
            ...(headersToObject((args[0] as RequestInit).headers) || {}),
          },
        };
      }
    }

    if (args.length > 1 && isFetchOptions(args[1])) {
      options = {
        ...options,
        ...args[1],
        beforeFetch: combineCallbacks(_combination, _options.beforeFetch, args[1].beforeFetch),
        afterFetch: combineCallbacks(_combination, _options.afterFetch, args[1].afterFetch),
        onFetchError: combineCallbacks(_combination, _options.onFetchError, args[1].onFetchError),
      };
    }

    return useFetch(computedUrl, fetchOptions, options);
  }

  return useFactoryFetch as typeof useFetch;
}

export function useFetch<T>(
  url: SignalOrGetter<string>,
): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
export function useFetch<T>(
  url: SignalOrGetter<string>,
  useFetchOptions: UseFetchOptions,
): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
export function useFetch<T>(
  url: SignalOrGetter<string>,
  options: RequestInit,
  useFetchOptions?: UseFetchOptions,
): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;

export function useFetch<T>(
  url: SignalOrGetter<string>,
  ...args: any[]
): UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>> {
  const supportsAbort = typeof AbortController === 'function';

  let fetchOptions: RequestInit = {};
  let options: UseFetchOptions = {
    immediate: true,
    refetch: false,
    timeout: 0,
    updateDataOnError: false,
  };

  interface InternalConfig {
    method: HttpMethod;
    type: DataType;
    payload: unknown;
    payloadType?: string;
  }

  const config: InternalConfig = {
    method: 'GET',
    type: 'text' as DataType,
    payload: undefined as unknown,
  };

  if (args.length > 0) {
    if (isFetchOptions(args[0])) options = { ...options, ...args[0] };
    else fetchOptions = args[0];
  }

  if (args.length > 1) {
    if (isFetchOptions(args[1])) options = { ...options, ...args[1] };
  }

  const { fetch = defaultWindow?.fetch ?? globalThis?.fetch, initialData, timeout } = options;

  // Event Hooks
  const responseEvent = createEventHook<Response>();
  const errorEvent = createEventHook<unknown>();
  const finallyEvent = createEventHook<unknown>();

  const isFinished = signal(false);
  const isFetching = signal(false);
  const aborted = signal(false);
  const statusCode = signal<number | null>(null);
  const response = signal<Response | null>(null);
  const error = signal<unknown>(null);
  const data = signal<T | null>((initialData ?? null) as T | null);

  const canAbort = computed(() => supportsAbort && isFetching());

  let controller: AbortController | undefined;
  let timer: Stoppable | undefined;

  const abort = (reason?: unknown) => {
    if (supportsAbort) {
      controller?.abort(reason);
      controller = new AbortController();
      controller.signal.onabort = () => aborted.set(true);
      fetchOptions = {
        ...fetchOptions,
        signal: controller.signal,
      };
    }
  };

  const loading = (isLoading: boolean) => {
    isFetching.set(isLoading);
    isFinished.set(!isLoading);
  };

  if (timeout) timer = useTimeoutFn(() => abort(), timeout, { immediate: false });

  let executeCounter = 0;

  const execute = async (throwOnFailed = false) => {
    abort();

    loading(true);
    error.set(null);
    statusCode.set(null);
    aborted.set(false);

    executeCounter += 1;
    const currentExecuteCounter = executeCounter;

    const defaultFetchOptions: RequestInit = {
      method: config.method,
      headers: {},
    };

    const payload = toValue(config.payload);
    if (payload) {
      const headers = headersToObject(defaultFetchOptions.headers) as Record<string, string>;
      // Set the payload to json type only if it's not provided and a literal object or array is provided and the object is not `formData`
      // The only case we can deduce the content type and `fetch` can't
      const proto = Object.getPrototypeOf(payload);
      if (
        !config.payloadType &&
        payload &&
        (proto === Object.prototype || Array.isArray(proto)) &&
        !(payload instanceof FormData)
      )
        config.payloadType = 'json';

      if (config.payloadType)
        headers['Content-Type'] = payloadMapping[config.payloadType] ?? config.payloadType;

      defaultFetchOptions.body =
        config.payloadType === 'json' ? JSON.stringify(payload) : (payload as BodyInit);
    }

    let isCanceled = false;
    const context: BeforeFetchContext = {
      url: toValue(url),
      options: {
        ...defaultFetchOptions,
        ...fetchOptions,
      },
      cancel: () => {
        isCanceled = true;
      },
    };

    if (options.beforeFetch) Object.assign(context, await options.beforeFetch(context));

    if (isCanceled || !fetch) {
      loading(false);
      return Promise.resolve(null);
    }

    let responseData: unknown = null;

    if (timer) timer.start();

    return fetch(context.url, {
      ...defaultFetchOptions,
      ...context.options,
      headers: {
        ...headersToObject(defaultFetchOptions.headers),
        ...headersToObject(context.options?.headers),
      },
    })
      .then(async (fetchResponse) => {
        response.set(fetchResponse);
        statusCode.set(fetchResponse.status);

        responseData = await fetchResponse.clone()[config.type]();

        // see: https://www.tjvantoll.com/2015/09/13/fetch-and-errors/
        if (!fetchResponse.ok) {
          data.set((initialData ?? null) as T | null);
          throw new Error(fetchResponse.statusText);
        }

        if (options.afterFetch) {
          ({ data: responseData } = await options.afterFetch({
            data: responseData,
            response: fetchResponse,
            context,
            execute,
          }));
        }
        data.set(responseData as T);

        responseEvent.trigger(fetchResponse);
        return fetchResponse;
      })
      .catch(async (fetchError) => {
        let errorData = fetchError.message || fetchError.name;

        if (options.onFetchError) {
          ({ error: errorData, data: responseData } = await options.onFetchError({
            data: responseData,
            error: fetchError,
            response: response(),
            context,
            execute,
          }));
        }

        error.set(errorData);
        if (options.updateDataOnError) data.set(responseData as T);

        errorEvent.trigger(fetchError);
        if (throwOnFailed) throw fetchError;
        return null;
      })
      .finally(() => {
        if (currentExecuteCounter === executeCounter) loading(false);
        if (timer) timer.stop();
        finallyEvent.trigger(null);
      });
  };

  const refetch = toRef(options.refetch);
  const urlRef = toRef(url);
  // Watch for URL changes and refetch trigger
  watchDeep(
    computed(() => {
      // Access both signals to track dependencies
      const r = toValue(refetch);
      const _u = toValue(urlRef);
      return { r, _u };
    }),
    ({ r }) => {
      if (r) execute();
    },
    { immediate: false },
  );

  const shell: UseFetchReturn<T> = {
    isFinished: computed(() => isFinished()),
    isFetching: computed(() => isFetching()),
    statusCode,
    response,
    error,
    data,
    canAbort,
    aborted,
    abort,
    execute,

    onFetchResponse: responseEvent.on,
    onFetchError: errorEvent.on,
    onFetchFinally: finallyEvent.on,
    // method
    get: setMethod('GET'),
    put: setMethod('PUT'),
    post: setMethod('POST'),
    delete: setMethod('DELETE'),
    patch: setMethod('PATCH'),
    head: setMethod('HEAD'),
    options: setMethod('OPTIONS'),
    // type
    json: setType('json'),
    text: setType('text'),
    blob: setType('blob'),
    arrayBuffer: setType('arrayBuffer'),
    formData: setType('formData'),
  };

  function setMethod(method: HttpMethod) {
    return (payload?: unknown, payloadType?: string) => {
      if (!isFetching()) {
        config.method = method;
        config.payload = payload;
        config.payloadType = payloadType;

        // watch for payload changes
        if (isSignal(config.payload)) {
          const payloadRef = toRef(config.payload);
          watchDeep(
            computed(() => {
              const r = toValue(refetch);
              const _p = toValue(payloadRef);
              return { r, _p };
            }),
            ({ r }) => {
              if (r) execute();
            },
            { immediate: false },
          );
        }

        return {
          ...shell,
          then(
            onFulfilled: (value: UseFetchReturn<T>) => unknown,
            onRejected: (reason: unknown) => unknown,
          ) {
            return waitUntilFinished().then(onFulfilled, onRejected);
          },
        } as unknown as UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
      }
      return undefined;
    };
  }

  function waitUntilFinished() {
    return new Promise<UseFetchReturn<T>>((resolve) => {
      resolve(shell);
    });
  }

  function setType(type: DataType) {
    return () => {
      if (!isFetching()) {
        config.type = type;
        return {
          ...shell,
          then(
            onFulfilled: (value: UseFetchReturn<T>) => unknown,
            onRejected: (reason: unknown) => unknown,
          ) {
            return waitUntilFinished().then(onFulfilled, onRejected);
          },
        } as unknown as UseFetchReturn<T> & PromiseLike<UseFetchReturn<T>>;
      }
      return undefined;
    };
  }

  if (options.immediate) Promise.resolve().then(() => execute());

  return {
    ...shell,
    then(onFulfilled, onRejected) {
      return waitUntilFinished().then(onFulfilled, onRejected);
    },
  };
}

function joinPaths(start: string, end: string): string {
  if (!start.endsWith('/') && !end.startsWith('/')) {
    return `${start}/${end}`;
  }

  if (start.endsWith('/') && end.startsWith('/')) {
    return `${start.slice(0, -1)}${end}`;
  }

  return `${start}${end}`;
}
