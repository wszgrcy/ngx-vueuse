import { computed, type Signal } from '@angular/core';
import { syncEffect } from '@cyia/ngx-vueuse/patch';
import type { Fn } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { isObject } from '@cyia/ngx-vueuse/shared';
import { toArray } from '@cyia/ngx-vueuse/shared';
import { unrefElement, type MaybeElement, type MaybeComputedElementRef } from '../unrefElement';
interface InferEventTarget<Events> {
  addEventListener: (event: Events, fn?: any, options?: any) => any;
  removeEventListener: (event: Events, fn?: any, options?: any) => any;
}

export type WindowEventName = keyof WindowEventMap;
export type DocumentEventName = keyof DocumentEventMap;
export type ShadowRootEventName = keyof ShadowRootEventMap;

export interface GeneralEventListener<E = Event> {
  (evt: E): void;
}

type SignalOrValue<T> = Signal<T> | T;
type SignalOrGetter<T> = Signal<T> | T | (() => T);
type Arrayable<T> = T | T[];
type MaybeRefOrGetter<T> = SignalOrGetter<T>;
type MaybeRef<T> = Signal<T> | T | (() => T);

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 * Returns a cleanup function (Fn) that removes all added event listeners.
 *
 * Overload 1: Omitted Window target
 */
export function useEventListener<E extends keyof WindowEventMap>(
  event: MaybeRefOrGetter<Arrayable<E>>,
  listener: MaybeRef<Arrayable<(this: Window, ev: WindowEventMap[E]) => any>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): Fn;

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 2: Explicitly Window target
 */
export function useEventListener<E extends keyof WindowEventMap>(
  target: Window,
  event: MaybeRefOrGetter<Arrayable<E>>,
  listener: MaybeRef<Arrayable<(this: Window, ev: WindowEventMap[E]) => any>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): Fn;

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 3: Explicitly Document target
 */
export function useEventListener<E extends keyof DocumentEventMap>(
  target: Document,
  event: MaybeRefOrGetter<Arrayable<E>>,
  listener: MaybeRef<Arrayable<(this: Document, ev: DocumentEventMap[E]) => any>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): Fn;

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 4: Explicitly ShadowRoot target
 */
export function useEventListener<E extends keyof ShadowRootEventMap>(
  target: MaybeRefOrGetter<Arrayable<ShadowRoot> | null | undefined>,
  event: MaybeRefOrGetter<Arrayable<E>>,
  listener: MaybeRef<Arrayable<(this: ShadowRoot, ev: ShadowRootEventMap[E]) => any>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): Fn;

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 5: Explicitly HTMLElement target (using Angular ElementRef concept)
 */
export function useEventListener<E extends keyof HTMLElementEventMap>(
  target: MaybeComputedElementRef<MaybeElement>,
  event: MaybeRefOrGetter<Arrayable<E>>,
  listener: MaybeRef<Arrayable<(this: HTMLElement, ev: HTMLElementEventMap[E]) => any>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): Fn;

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 6: Custom event target with event type infer
 */
export function useEventListener<Names extends string, EventType = Event>(
  target: MaybeRefOrGetter<Arrayable<InferEventTarget<Names>> | null | undefined>,
  event: MaybeRefOrGetter<Arrayable<Names>>,
  listener: MaybeRef<Arrayable<GeneralEventListener<EventType>>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): Fn;

/**
 * Register using addEventListener on mounted, and removeEventListener automatically on unmounted.
 *
 * Overload 7: Custom event target fallback
 */
export function useEventListener<EventType = Event>(
  target: MaybeRefOrGetter<Arrayable<EventTarget> | null | undefined>,
  event: MaybeRefOrGetter<Arrayable<string>>,
  listener: MaybeRef<Arrayable<GeneralEventListener<EventType>>>,
  options?: MaybeRefOrGetter<boolean | AddEventListenerOptions>,
): Fn;

export function useEventListener(...args: any[]): Fn {
  const register = (
    el: EventTarget,
    event: string,
    listener: any,
    options: boolean | AddEventListenerOptions | undefined,
  ) => {
    el.addEventListener(event, listener, options);
    return () => el.removeEventListener(event, listener, options);
  };

  const firstParamTargets = computed(() => {
    const test = toArray(toValue(args[0] as any)).filter((e: any) => e != null);
    return test.every((e: any) => typeof e !== 'string') ? test : undefined;
  });

  let cleanups: Array<() => void> = [];

  const stop = syncEffect(() => {
    const explicitTargets = firstParamTargets();
    // Replicate the ?? [defaultWindow] logic from the original source function
    const raw_targets =
      explicitTargets?.map((e: any) => unrefElement(e as never)) ??
      (typeof window !== 'undefined' && window ? [window].filter((e: any) => e != null) : []);
    const raw_events = toArray(toValue(explicitTargets != null ? args[1] : args[0]) as string[]);
    const raw_listeners = toArray((explicitTargets != null ? args[2] : args[1]) as Function[]);
    const raw_options = toValue(explicitTargets != null ? args[3] : args[2]) as
      | boolean
      | AddEventListenerOptions
      | undefined;

    // Clean up previous listeners (replicating Vue's onCleanup behavior)
    cleanups.forEach((fn) => fn());
    cleanups = [];

    if (!raw_targets?.length || !raw_events?.length || !raw_listeners?.length) return;

    // create a clone of options, to avoid it being changed reactively on removal
    const optionsClone = isObject(raw_options) ? { ...raw_options } : raw_options;
    cleanups = raw_targets.flatMap((el) =>
      raw_events.flatMap((event) =>
        raw_listeners.map((listener) => register(el, event, listener, optionsClone)),
      ),
    );
  });

  return () => {
    cleanups.forEach((fn) => fn());
    stop.destroy();
  };
}
