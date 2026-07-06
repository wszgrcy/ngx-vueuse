import type { SignalOrGetter } from '../utils/types';
import type { Fn } from '../utils/types';
import { customRef } from '../customRef';
import { watch } from '@cyia/ngx-vueuse/patch';

export type ComputedGetter<T> = (oldValue?: T) => T;
export interface WritableComputedOptions<T> {
  get: (oldValue?: T) => T;
  set: (v: T) => void;
}

export interface ComputedWithControlRefExtra {
  /**
   * Force update the computed value.
   */
  trigger: () => void;
}

export interface ComputedRefWithControl<T>
  extends ReturnType<typeof customRef<T>>, ComputedWithControlRefExtra {}
export interface WritableComputedRefWithControl<T>
  extends ComputedRefWithControl<T>, ComputedWithControlRefExtra {}

export type ComputedWithControlRef<T = any> =
  | ComputedRefWithControl<T>
  | WritableComputedRefWithControl<T>;

export function computedWithControl<T>(
  source: SignalOrGetter<T>,
  fn: ComputedGetter<T>,
  options?: { immediate?: boolean },
): ComputedRefWithControl<T>;

export function computedWithControl<T>(
  source: SignalOrGetter<T>,
  fn: WritableComputedOptions<T>,
  options?: { immediate?: boolean },
): WritableComputedRefWithControl<T>;

/**
 * Explicitly define the deps of computed.
 *
 * @param source
 * @param fn
 */
export function computedWithControl<T>(
  source: SignalOrGetter<T>,
  fn: ComputedGetter<T> | WritableComputedOptions<T>,
  options: { immediate?: boolean } = {},
): ComputedWithControlRef<T> {
  let v: T = undefined!;
  let track: Fn;
  let trigger: Fn;
  let dirty = true;

  const update = () => {
    dirty = true;
    trigger();
  };

  // Use flush: 'sync' equivalent - watch with immediate false
  watch(source as any, update, { immediate: false, ...options });

  const get = typeof fn === 'function' ? fn : fn.get;
  const set = typeof fn === 'function' ? undefined : fn.set;

  const result = customRef<T>((_track, _trigger) => {
    track = _track;
    trigger = _trigger;

    return {
      get() {
        if (dirty) {
          v = get(v);
          dirty = false;
        }
        track();
        return v;
      },
      set(v) {
        set?.(v);
      },
    };
  }) as ComputedRefWithControl<T>;

  result.trigger = update;
  return result;
}

/** @deprecated use `computedWithControl` instead */
export const controlledComputed = computedWithControl;
