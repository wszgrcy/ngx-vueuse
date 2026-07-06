import type { Signal, WritableSignal } from '@angular/core';
import { computed, signal } from '@angular/core';

type MaybeRef<T> = T | Signal<T>;

function toValue<T>(v: MaybeRef<T>): T {
  return typeof v === 'function' && !isSignal(v) ? (v as () => T)() : isSignal(v) ? v() : v;
}

function isSignal<T>(v: unknown): v is Signal<T> {
  return typeof (v as Signal<T>).toString === 'function';
}

export interface UseStepperReturn<StepName, Steps, Step> {
  /** List of steps. */
  steps: Signal<Steps>;
  /** List of step names. */
  stepNames: Signal<StepName[]>;
  /** Index of the current step. */
  index: WritableSignal<number>;
  /** Current step. */
  current: Signal<Step>;
  /** Next step, or undefined if the current step is the last one. */
  next: Signal<StepName | undefined>;
  /** Previous step, or undefined if the current step is the first one. */
  previous: Signal<StepName | undefined>;
  /** Whether the current step is the first one. */
  isFirst: Signal<boolean>;
  /** Whether the current step is the last one. */
  isLast: Signal<boolean>;
  /** Get the step at the specified index. */
  at: (index: number) => Step | undefined;
  /** Get a step by the specified name. */
  get: (step: StepName) => Step | undefined;
  /** Go to the specified step. */
  goTo: (step: StepName) => void;
  /** Go to the next step. Does nothing if the current step is the last one. */
  goToNext: () => void;
  /** Go to the previous step. Does nothing if the current step is the previous one. */
  goToPrevious: () => void;
  /** Go back to the given step, only if the current step is after. */
  goBackTo: (step: StepName) => void;
  /** Checks whether the given step is the next step. */
  isNext: (step: StepName) => boolean;
  /** Checks whether the given step is the previous step. */
  isPrevious: (step: StepName) => boolean;
  /** Checks whether the given step is the current step. */
  isCurrent: (step: StepName) => boolean;
  /** Checks if the current step is before the given step. */
  isBefore: (step: StepName) => boolean;
  /** Checks if the current step is after the given step. */
  isAfter: (step: StepName) => boolean;
}

export function useStepper<T extends string | number>(
  steps: MaybeRef<T[]>,
  initialStep?: T,
): UseStepperReturn<T, T[], T>;
export function useStepper<T extends Record<string, unknown>>(
  steps: MaybeRef<T>,
  initialStep?: keyof T,
): UseStepperReturn<Exclude<keyof T, symbol>, T, T[keyof T]>;
export function useStepper(steps: any, initialStep?: any): UseStepperReturn<any, any, any> {
  const stepsRef = signal(steps);
  const stepNames = computed(() =>
    Array.isArray(stepsRef()) ? stepsRef() : Object.keys(stepsRef()),
  );
  const index = signal(stepNames().indexOf(initialStep ?? stepNames()[0]));
  const current = computed(() => at(index()));
  const isFirst = computed(() => index() === 0);
  const isLast = computed(() => index() === stepNames().length - 1);
  const next = computed(() => stepNames()[index() + 1]);
  const previous = computed(() => stepNames()[index() - 1]);

  function at(index: number) {
    if (Array.isArray(stepsRef())) return stepsRef()[index];

    return stepsRef()[stepNames()[index]];
  }

  function get(step: any) {
    if (!stepNames().includes(step)) return;

    return at(stepNames().indexOf(step));
  }

  function goTo(step: any) {
    if (stepNames().includes(step)) index.set(stepNames().indexOf(step));
  }

  function goToNext() {
    if (isLast()) return;

    index.update((v) => v + 1);
  }

  function goToPrevious() {
    if (isFirst()) return;

    index.update((v) => v - 1);
  }

  function goBackTo(step: any) {
    if (isAfter(step)) goTo(step);
  }

  function isNext(step: any) {
    return stepNames().indexOf(step) === index() + 1;
  }

  function isPrevious(step: any) {
    return stepNames().indexOf(step) === index() - 1;
  }

  function isCurrent(step: any) {
    return stepNames().indexOf(step) === index();
  }

  function isBefore(step: any) {
    return index() < stepNames().indexOf(step);
  }

  function isAfter(step: any) {
    return index() > stepNames().indexOf(step);
  }

  return {
    steps: stepsRef,
    stepNames,
    index,
    current,
    next,
    previous,
    isFirst,
    isLast,
    at,
    get,
    goTo,
    goToNext,
    goToPrevious,
    goBackTo,
    isNext,
    isPrevious,
    isCurrent,
    isBefore,
    isAfter,
  };
}
