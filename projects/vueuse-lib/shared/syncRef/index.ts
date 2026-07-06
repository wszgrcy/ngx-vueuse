import { watch } from '@cyia/ngx-vueuse/patch';
import type { WatchHandle } from '@cyia/ngx-vueuse/patch';
import { untracked, type WritableSignal } from '@angular/core';

type Direction = 'ltr' | 'rtl' | 'both';
type SpecificFieldPartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
/**
 * A = B
 */
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/**
 * A ∩ B ≠ ∅
 */
type IntersectButNotEqual<A, B> =
  Equal<A, B> extends true ? false : A & B extends never ? false : true;

/**
 * A ⊆ B
 */
type IncludeButNotEqual<A, B> = Equal<A, B> extends true ? false : A extends B ? true : false;

/**
 * A ∩ B = ∅
 */
type NotIntersect<A, B> = Equal<A, B> extends true ? false : A & B extends never ? true : false;

interface EqualType<
  D extends Direction,
  L,
  R,
  O extends keyof Transform<L, R> = D extends 'both' ? 'ltr' | 'rtl' : D,
> {
  transform?: SpecificFieldPartial<Pick<Transform<L, R>, O>, O>;
}

type StrictIncludeMap<
  IncludeType extends 'LR' | 'RL',
  D extends Exclude<Direction, 'both'>,
  L,
  R,
> = Equal<[IncludeType, D], ['LR', 'ltr']> & Equal<[IncludeType, D], ['RL', 'rtl']> extends true
  ? {
      transform?: SpecificFieldPartial<Pick<Transform<L, R>, D>, D>;
    }
  : {
      transform: Pick<Transform<L, R>, D>;
    };

// L ⊆ R
type StrictIncludeType<
  IncludeType extends 'LR' | 'RL',
  D extends Direction,
  L,
  R,
> = D extends 'both'
  ? {
      transform: SpecificFieldPartial<Transform<L, R>, IncludeType extends 'LR' ? 'ltr' : 'rtl'>;
    }
  : D extends Exclude<Direction, 'both'>
    ? StrictIncludeMap<IncludeType, D, L, R>
    : never;

// L ∩ R ≠ ∅
type IntersectButNotEqualType<D extends Direction, L, R> = D extends 'both'
  ? {
      transform: Transform<L, R>;
    }
  : D extends Exclude<Direction, 'both'>
    ? {
        transform: Pick<Transform<L, R>, D>;
      }
    : never;

// L ∩ R = ∅
type NotIntersectType<D extends Direction, L, R> = IntersectButNotEqualType<D, L, R>;
interface Transform<L, R> {
  ltr: (left: L) => R;
  rtl: (right: R) => L;
}

type TransformType<D extends Direction, L, R> =
  Equal<L, R> extends true
    ? // L = R
      EqualType<D, L, R>
    : IncludeButNotEqual<L, R> extends true
      ? // L ⊆ R
        StrictIncludeType<'LR', D, L, R>
      : IncludeButNotEqual<R, L> extends true
        ? // R ⊆ L
          StrictIncludeType<'RL', D, L, R>
        : IntersectButNotEqual<L, R> extends true
          ? // L ∩ R ≠ ∅
            IntersectButNotEqualType<D, L, R>
          : NotIntersect<L, R> extends true
            ? // L ∩ R = ∅
              NotIntersectType<D, L, R>
            : never;

export type SyncRefOptions<L, R, D extends Direction> = {
  /**
   * Deep watching is NOT supported in Angular.
   * Angular signals are inherently shallow — only reference changes trigger effects.
   * This option is accepted for API compatibility but has no effect.
   * For deep object tracking, use nested signals or computed properties.
   *
   * @default false (ignored)
   */
  deep?: boolean;
  /**
   * Sync values immediately
   *
   * @default true
   */
  immediate?: boolean;

  /**
   * Direction of syncing. Value will be redefined if you define syncConvertors
   *
   * @default 'both'
   */
  direction?: D;
} & TransformType<D, L, R>;

/**
 * Note: Angular `effect()` does not have a `flush` option like Vue's `watch`.
 * VueUse's original `syncRef` supported `flush: 'sync' | 'pre' | 'post'` via `watchPausable`.
 * In Angular, effects execute synchronously during the change detection cycle,
 * which is equivalent to `flush: 'sync'`. If you need precise timing control,
 * consider using `afterNextRender()` or manual computed() + effect() composition.
 */

/**
 * Two-way signals synchronization.
 * From the set theory perspective to restrict the option's type
 * Check in the following order:
 * 1. L = R
 * 2. L ∩ R ≠ ∅
 * 3. L ⊆ R
 * 4. L ∩ R = ∅
 */
export function syncRef<L, R, D extends Direction = 'both'>(
  left: WritableSignal<L>,
  right: WritableSignal<R>,
  ...[options]: Equal<L, R> extends true
    ? [options?: SyncRefOptions<L, R, D>]
    : [options: SyncRefOptions<L, R, D>]
): () => void {
  const {
    deep: _deep = false, // Ignored — Angular signals don't support deep watching
    immediate = true,
    direction = 'both',
    transform = {},
  } = options || {};

  const effectRefs: WatchHandle[] = [];

  const transformLTR = ('ltr' in transform && transform.ltr) || ((v) => v);
  const transformRTL = ('rtl' in transform && transform.rtl) || ((v) => v);

  let syncing = false;

  if (direction === 'both' || direction === 'ltr') {
    effectRefs.push(
      watch(
        left,
        (l) => {
          if (syncing) return;
          syncing = true;
          untracked(() => {
            right.set(transformLTR(l) as R);
          });
          syncing = false;
        },
        { immediate },
      ),
    );
  }

  if (direction === 'both' || direction === 'rtl') {
    effectRefs.push(
      watch(
        right,
        (r) => {
          if (syncing) return;
          syncing = true;
          untracked(() => {
            left.set(transformRTL(r) as L);
          });
          syncing = false;
        },
        { immediate },
      ),
    );
  }

  // Immediate sync is now handled by effect({ immediate }) above

  const stop = () => {
    effectRefs.forEach((e) => (e as any)());
  };

  return stop;
}
