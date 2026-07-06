import type {
  Signal as AngularSignal,
  WritableSignal as AngularWritableSignal,
} from '@angular/core';

export type WritableSignal<T = any> = AngularWritableSignal<T>;

export type Signal<T> = AngularSignal<T>;

/**
 * Void function
 */
export type Fn = () => void;

/**
 * Any function
 */
export type AnyFn = (...args: any[]) => any;

/**
 * A ref that allow to set null or undefined
 * Provides Vue-like .value getter and .set() setter API
 */
export type RemovableRef<T> = WritableSignal<T>;

/**
 * Maybe it's a computed ref, or a readonly value, or a getter function
 */
export type ReadonlyRefOrGetter<T> = Signal<T> | (() => T);

/**
 * Make all the nested attributes of an object or array to Signal or value
 */
export type DeepMaybeRef<T> =
  T extends Signal<infer V>
    ? SignalOrValue<V>
    : T extends Array<any> | object
      ? { [K in keyof T]: DeepMaybeRef<T[K]> }
      : SignalOrValue<T>;

export type SignalOrValue<T> = Signal<T> | T;

/**
 * A Signal, value, or getter function (matches VueUse's MaybeRefOrGetter)
 */
export type SignalOrGetter<T> = Signal<T> | T | (() => T);

/**
 * Matches VueUse's MaybeRefOrGetter - a value, signal, or getter function
 */
export type MaybeRefOrGetter<T> = Signal<T> | T | (() => T);

/**
 * Matches VueUse's MaybeRef - a value or signal
 */
export type MaybeRef<T> = Signal<T> | T;

export type Arrayable<T> = T[] | T;

/**
 * Infers the element type of an array
 */
export type ElementOf<T> = T extends (infer E)[] ? E : never;

export type ShallowUnwrapRef<T> = T extends Signal<infer P> ? P : T;

/**
 * Unwrap the ref value - for Angular signals, call the signal to get the value.
 */
export type UnwrapRef<T> = T extends Signal<infer V> ? V : T;

export type Awaitable<T> = Promise<T> | T;

export type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;

/**
 * Compatible with versions below TypeScript 4.5 Awaited
 */
export type Awaited<T> = T extends null | undefined
  ? T
  : T extends object & { then: (onfulfilled: infer F, ...args: infer _) => any }
    ? F extends (value: infer V, ...args: infer _) => any
      ? Awaited<V>
      : never
    : T;

export type Promisify<T> = Promise<Awaited<T>>;

export type PromisifyFn<T extends AnyFn> = (...args: ArgumentsType<T>) => Promisify<ReturnType<T>>;

export interface Pausable {
  /**
   * A ref indicate whether a pausable instance is active
   */
  readonly isActive: ReturnType<typeof import('@angular/core').computed>;

  /**
   * Temporary pause the effect from executing
   */
  pause: Fn;

  /**
   * Resume the effects
   */
  resume: Fn;
}

export interface Stoppable<StartFnArgs extends any[] = any[]> {
  /**
   * A ref indicate whether a stoppable instance is executing
   */
  readonly isPending: ReturnType<typeof import('@angular/core').computed>;

  /**
   * Stop the effect from executing
   */
  stop: Fn;

  /**
   * Start the effects
   */
  start: (...args: StartFnArgs) => void;
}

export type WatchOptionFlush = 'pre' | 'post' | 'sync';

export interface ConfigurableFlush {
  /**
   * Timing for monitoring changes, refer to WatchOptions for more details
   *
   * @default 'pre'
   */
  flush?: WatchOptionFlush;
}

export interface ConfigurableFlushSync {
  /**
   * Timing for monitoring changes, refer to WatchOptions for more details.
   * Unlike `watch()`, the default is set to `sync`
   *
   * @default 'sync'
   */
  flush?: WatchOptionFlush;
}

export type MapSources<T> = {
  [K in keyof T]: T[K] extends () => infer V ? V : never;
};
export type MapOldSources<T, Immediate> = {
  [K in keyof T]: T[K] extends () => infer V ? (Immediate extends true ? V | undefined : V) : never;
};

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };

// https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type
export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
/**
 * will return `true` if `T` is `any`, or `false` otherwise
 */
export type IsAny<T> = IfAny<T, true, false>;

/**
 * Universal timer handle that works in both browser and Node.js environments
 */
export type TimerHandle = ReturnType<typeof setTimeout> | undefined;
