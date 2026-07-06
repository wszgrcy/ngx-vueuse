import type { Signal, WritableSignal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import { computed, signal } from '@angular/core';
import { defaultWindow } from '../_configurable';
import { watch } from '@cyia/ngx-vueuse/patch';
import { identity as linear, promiseTimeout, tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';

type MaybeRefOrGetter<T> = T | (() => T);

/**
 * Cubic bezier points
 */
export type CubicBezierPoints = [number, number, number, number];

/**
 * Easing function
 */
export type EasingFunction = (n: number) => number;

/**
 * Interpolation function
 */
export type InterpolationFunction<T> = (from: T, to: T, t: number) => T;

/**
 * Transition options
 */
export interface TransitionOptions<T> extends ConfigurableWindow {
  /**
   * Manually abort a transition
   */
  abort?: () => any;

  /**
   * Transition duration in milliseconds
   */
  duration?: MaybeRefOrGetter<number>;

  /**
   * Easing function or cubic bezier points to calculate transition progress
   */
  easing?: MaybeRefOrGetter<EasingFunction | CubicBezierPoints>;

  /**
   * Custom interpolation function
   */
  interpolation?: InterpolationFunction<T>;

  /**
   * Easing function or cubic bezier points to calculate transition progress
   * @deprecated The `transition` option is deprecated, use `easing` instead.
   */
  transition?: MaybeRefOrGetter<EasingFunction | CubicBezierPoints>;
}

export interface UseTransitionOptions<T> extends TransitionOptions<T> {
  /**
   * Milliseconds to wait before starting transition
   */
  delay?: MaybeRefOrGetter<number>;

  /**
   * Disables the transition
   */
  disabled?: MaybeRefOrGetter<boolean>;

  /**
   * Callback to execute after transition finishes
   */
  onFinished?: () => void;

  /**
   * Callback to execute after transition starts
   */
  onStarted?: () => void;
}

const _TransitionPresets = {
  easeInSine: [0.12, 0, 0.39, 0] as const,
  easeOutSine: [0.61, 1, 0.88, 1] as const,
  easeInOutSine: [0.37, 0, 0.63, 1] as const,
  easeInQuad: [0.11, 0, 0.5, 0] as const,
  easeOutQuad: [0.5, 1, 0.89, 1] as const,
  easeInOutQuad: [0.45, 0, 0.55, 1] as const,
  easeInCubic: [0.32, 0, 0.67, 0] as const,
  easeOutCubic: [0.33, 1, 0.68, 1] as const,
  easeInOutCubic: [0.65, 0, 0.35, 1] as const,
  easeInQuart: [0.5, 0, 0.75, 0] as const,
  easeOutQuart: [0.25, 1, 0.5, 1] as const,
  easeInOutQuart: [0.76, 0, 0.24, 1] as const,
  easeInQuint: [0.64, 0, 0.78, 0] as const,
  easeOutQuint: [0.22, 1, 0.36, 1] as const,
  easeInOutQuint: [0.83, 0, 0.17, 1] as const,
  easeInExpo: [0.7, 0, 0.84, 0] as const,
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeInOutExpo: [0.87, 0, 0.13, 1] as const,
  easeInCirc: [0.55, 0, 1, 0.45] as const,
  easeOutCirc: [0, 0.55, 0.45, 1] as const,
  easeInOutCirc: [0.85, 0, 0.15, 1] as const,
  easeInBack: [0.36, 0, 0.66, -0.56] as const,
  easeOutBack: [0.34, 1.56, 0.64, 1] as const,
  easeInOutBack: [0.68, -0.6, 0.32, 1.6] as const,
} as const;

/**
 * Common transitions
 *
 * @see https://easings.net
 */
export const TransitionPresets = Object.assign({}, { linear }, _TransitionPresets) as Record<
  keyof typeof _TransitionPresets,
  CubicBezierPoints
> & { linear: EasingFunction };

/**
 * Create an easing function from cubic bezier points.
 */
function createEasingFunction([p0, p1, p2, p3]: CubicBezierPoints): EasingFunction {
  const a = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
  const b = (a1: number, a2: number) => 3 * a2 - 6 * a1;
  const c = (a1: number) => 3 * a1;

  const calcBezier = (t: number, a1: number, a2: number) =>
    ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;

  const getSlope = (t: number, a1: number, a2: number) =>
    3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1);

  const getTforX = (x: number) => {
    let aGuessT = x;

    for (let i = 0; i < 4; ++i) {
      const currentSlope = getSlope(aGuessT, p0, p2);
      if (currentSlope === 0) return aGuessT;
      const currentX = calcBezier(aGuessT, p0, p2) - x;
      aGuessT -= currentX / currentSlope;
    }

    return aGuessT;
  };

  return (x: number) => (p0 === p1 && p2 === p3 ? x : calcBezier(getTforX(x), p1, p3));
}

function lerp(a: number, b: number, alpha: number) {
  return a + alpha * (b - a);
}

function defaultInterpolation<T>(a: T, b: T, t: number) {
  const aVal = toValue(a);
  const bVal = toValue(b);

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return lerp(aVal, bVal, t) as T;
  }

  if (Array.isArray(aVal) && Array.isArray(bVal)) {
    return aVal.map((v, i) =>
      lerp(
        v as unknown as number,
        toValue(bVal[i] as MaybeRefOrGetter<unknown>) as unknown as number,
        t,
      ),
    ) as T;
  }

  throw new TypeError('Unknown transition type, specify an interpolation function.');
}

function normalizeEasing(easing: MaybeRefOrGetter<EasingFunction | CubicBezierPoints> | undefined) {
  return typeof easing === 'function' ? easing : (toValue(easing) ?? linear);
}

/**
 * Transition from one value to another.
 *
 * @param source
 * @param from
 * @param to
 * @param options
 */
export function transition<T>(
  source: WritableSignal<T>,
  from: MaybeRefOrGetter<T>,
  to: MaybeRefOrGetter<T>,
  options: TransitionOptions<T> = {},
): PromiseLike<void> {
  const { window = defaultWindow } = options;
  const fromVal = toValue(from);
  const toVal = toValue(to);
  const duration = toValue(options.duration) ?? 1000;
  const startedAt = Date.now();
  const endAt = Date.now() + duration;

  const interpolation =
    typeof options.interpolation === 'function' ? options.interpolation : defaultInterpolation;

  const trans =
    typeof options.easing !== 'undefined'
      ? normalizeEasing(options.easing)
      : normalizeEasing(options.transition);

  const ease = typeof trans === 'function' ? trans : createEasingFunction(trans);

  return new Promise<void>((resolve) => {
    source.set(fromVal);
    const tick = () => {
      if (options.abort?.()) {
        resolve();

        return;
      }

      const now = Date.now();
      const alpha = ease((now - startedAt) / duration) as number;

      source.set(interpolation(fromVal, toVal, alpha) as T);

      if (now < endAt) {
        window?.requestAnimationFrame(tick);
      } else {
        source.set(toVal);

        resolve();
      }
    };

    tick();
  });
}

/**
 * Transition from one value to another.
 * @deprecated The `executeTransition` function is deprecated, use `transition` instead.
 *
 * @param source
 * @param from
 * @param to
 * @param options
 */
export function executeTransition<T>(
  source: WritableSignal<T>,
  from: MaybeRefOrGetter<T>,
  to: MaybeRefOrGetter<T>,
  options: TransitionOptions<T> = {},
) {
  return transition(source, from, to, options);
}

/**
 * Follow value with a transition.
 *
 * @see https://vueuse.org/useTransition
 * @param source
 * @param options
 */
export function useTransition<T>(
  source: MaybeRefOrGetter<T>,
  options: UseTransitionOptions<T> = {},
): Signal<T> {
  const currentIdRef = { value: 0 };

  const sourceVal = (): T => {
    const v = toValue(source);

    return typeof options.interpolation === 'undefined' && Array.isArray(v)
      ? ((v as unknown as unknown[]).map((item: unknown) =>
          toValue(item as MaybeRefOrGetter<unknown>),
        ) as T)
      : v;
  };

  const outputRef = signal<T>(sourceVal());

  // watch(sourceVal, async (to) => { ... })
  let initialized = false;
  watch(sourceVal, async (to) => {
    if (initialized) {
      _watchSourceChange(to, outputRef, options, currentIdRef);
    }
    initialized = true;
  });

  // watch(() => toValue(options.disabled), (disabled) => { ... })
  watch(
    () => toValue(options.disabled),
    (disabled) => {
      if (disabled) {
        currentIdRef.value++;
        outputRef.set(sourceVal());
      }
    },
  );

  tryOnScopeDispose(() => {
    currentIdRef.value++;
  });

  return computed(() => (toValue(options.disabled) ? sourceVal() : outputRef()));
}

async function _watchSourceChange<T>(
  to: T,
  outputRef: WritableSignal<T>,
  options: UseTransitionOptions<T>,
  currentIdRef: { value: number },
) {
  if (toValue(options.disabled)) return;

  const id = ++currentIdRef.value;

  if (options.delay) await promiseTimeout(toValue(options.delay));

  if (id !== currentIdRef.value) return;

  options.onStarted?.();

  await transition(outputRef, outputRef(), to, {
    ...options,
    abort: () => currentIdRef.value !== id || options.abort?.(),
  });

  if (currentIdRef.value === id) {
    options.onFinished?.();
  }
}
