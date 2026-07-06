import type { Signal } from '@angular/core';
import { signal } from '@angular/core';

export interface TemplatePromiseProps<Return, Args extends any[] = []> {
  /**
   * The promise instance.
   */
  promise: Promise<Return> | undefined;
  /**
   * Resolve the promise.
   */
  resolve: (v: Return | Promise<Return>) => void;
  /**
   * Reject the promise.
   */
  reject: (v: any) => void;
  /**
   * Arguments passed to TemplatePromise.start()
   */
  args: Args;
  /**
   * Indicates if the promise is resolving.
   * When passing another promise to `resolve`, this will be set to `true` until the promise is resolved.
   */
  isResolving: boolean;
  /**
   * Options passed to createTemplatePromise()
   */
  options: TemplatePromiseOptions;
  /**
   * Unique key for list rendering.
   */
  key: number;
}

export interface TemplatePromiseOptions {
  /**
   * Determines if the promise can be called only once at a time.
   *
   * @default false
   */
  singleton?: boolean;

  /**
   * Transition props for the promise.
   */
  transition?: any;
}

export type TemplatePromise<Return, Args extends any[] = []> = {
  start: (...args: Args) => Promise<Return>;
} & {
  /**
   * Internal instances signal for template access.
   */
  _instances: Signal<TemplatePromiseProps<Return, Args>[]>;
};

/**
 * Creates a template promise instance manager.
 *
 * Returns an object with `start()` method and `_instances` signal for template rendering.
 * In Angular, use the `_instances` signal directly in templates with `@for` blocks.
 *
 * @see https://vueuse.org/createTemplatePromise
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createTemplatePromise<Return, Args extends any[] = []>(
  options: TemplatePromiseOptions = {},
): TemplatePromise<Return, Args> {
  let index = 0;
  const instances = signal<TemplatePromiseProps<Return, Args>[]>([]);

  function create(...args: Args) {
    const props: TemplatePromiseProps<Return, Args> = {
      key: index++,
      args,
      promise: undefined,
      resolve: () => {},
      reject: () => {},
      isResolving: false,
      options,
    };

    instances.update((list) => [...list, props]);

    props.promise = new Promise<Return>((_resolve, _reject) => {
      props.resolve = (v) => {
        props.isResolving = true;
        return _resolve(v);
      };
      props.reject = _reject;
    }).finally(() => {
      props.promise = undefined;
      const currentIndex = instances().indexOf(props);
      if (currentIndex !== -1) {
        instances.update((list) => list.filter((_, i) => i !== currentIndex));
      }
    });

    return props.promise;
  }

  function start(...args: Args) {
    if (options.singleton && instances().length > 0) return instances()[0].promise;
    return create(...args);
  }

  return {
    start,
    _instances: instances as Signal<TemplatePromiseProps<Return, Args>[]>,
  } as TemplatePromise<Return, Args>;
}
