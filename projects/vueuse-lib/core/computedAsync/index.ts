import type { Fn } from '@cyia/ngx-vueuse/shared';
import type { Signal, WritableSignal } from '@angular/core';
import { noop } from '@cyia/ngx-vueuse/shared';
import { computed, effect, isSignal, signal, untracked } from '@angular/core';

/**
 * Handle overlapping async evaluations.
 *
 * @param cancelCallback The provided callback is invoked when a re-evaluation of the computed value is triggered before the previous one finishes
 */
export type AsyncComputedOnCancel = (cancelCallback: Fn) => void;

export interface AsyncComputedOptions<Lazy = boolean> {
  /**
   * Should value be evaluated lazily
   *
   * @default false
   */
  lazy?: Lazy;

  /**
   * Signal passed to receive the update of async evaluation
   */
  evaluating?: WritableSignal<boolean>;

  /**
   * Use shallow ref
   *
   * @default true
   */
  shallow?: boolean;

  /**
   * Callback when error is caught.
   */
  onError?: (e: unknown) => void;
}

/**
 * Create an asynchronous computed signal.
 *
 * @see https://vueuse.org/computedAsync
 * @param evaluationCallback     The promise-returning callback which generates the computed value
 * @param initialState           The initial state, used until the first evaluation finishes
 * @param optionsOrRef           Additional options or a signal passed to receive the updates of the async evaluation
 */
export function computedAsync<T>(
  evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
  initialState: T,
  optionsOrRef: AsyncComputedOptions<true>,
): Signal<T>;
export function computedAsync<T>(
  evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
  initialState: undefined,
  optionsOrRef: AsyncComputedOptions<true>,
): Signal<T | undefined>;
export function computedAsync<T>(
  evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
  initialState: T,
  optionsOrRef?: WritableSignal<boolean> | AsyncComputedOptions,
): Signal<T>;
export function computedAsync<T>(
  evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
  initialState?: undefined,
  optionsOrRef?: WritableSignal<boolean> | AsyncComputedOptions,
): Signal<T | undefined>;
export function computedAsync<T>(
  evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
  initialState?: T,
  optionsOrRef?: Signal<boolean> | AsyncComputedOptions,
): Signal<T> | Signal<T | undefined> {
  let options: AsyncComputedOptions;

  if (isSignal(optionsOrRef)) {
    options = {
      evaluating: optionsOrRef as WritableSignal<boolean>,
    };
  } else {
    options = optionsOrRef || {};
  }

  const {
    lazy = false,
    evaluating = undefined,
    shallow = true,
    onError = globalThis.reportError ?? noop,
  } = options;

  const started = signal(!lazy);
  const current: WritableSignal<T | undefined> = signal(initialState as T | undefined);
  let counter = 0;

  // Store invalidate callbacks for cancellation
  let invalidateCallbacks: Array<() => void> = [];

  const run = async () => {
    if (!started()) return;

    // Execute previous invalidate callbacks (equivalent to Vue's watchEffect re-run)
    const prevInvalidateCallbacks = invalidateCallbacks;
    invalidateCallbacks = [];
    for (const cb of prevInvalidateCallbacks) cb();

    counter++;
    const counterAtBeginning = counter;
    let hasFinished = false;

    // Defer initial setting of `evaluating` signal
    // to avoid having it as a dependency
    if (evaluating) {
      Promise.resolve().then(() => {
        evaluating.set(true);
      });
    }

    try {
      const result = await evaluationCallback((cancelCallback) => {
        // Register invalidate callback (equivalent to Vue's onInvalidate)
        invalidateCallbacks.push(() => {
          if (evaluating) evaluating.set(false);

          if (!hasFinished) cancelCallback();
        });
      });

      if (counterAtBeginning === counter) current.set(result as T);
    } catch (e) {
      onError(e);
    } finally {
      if (evaluating && counterAtBeginning === counter) evaluating.set(false);

      hasFinished = true;
    }
  };

  // Use effect to re-run when dependencies change (equivalent to Vue's watchEffect)
  // In non-lazy mode, started is already true, so effect runs immediately
  // In lazy mode, started becomes true when the computed is accessed
  const effectRef = effect(() => {
    // Access started to create dependency
    started();
    // Run the async computation
    run();
  });

  // Clean up effect when the function is no longer needed
  // This is important to prevent memory leaks
  // Note: In Angular, effects are automatically cleaned up when the injector is destroyed

  // For non-lazy mode, also call run() immediately to ensure synchronous execution
  // The effect will handle re-runs when dependencies change
  if (!lazy) {
    run();
  }

  if (lazy) {
    let lazyTriggered = false;
    return computed(() => {
      if (!lazyTriggered) {
        lazyTriggered = true;
        untracked(() => {
          started.set(true);
          run();
        });
      }
      return current();
    });
  } else {
    return current;
  }
}

/** @deprecated use `computedAsync` instead */
export const asyncComputed = computedAsync;
