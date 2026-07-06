import type { WatchHandle } from '@cyia/ngx-vueuse/patch';
import { watch } from '@cyia/ngx-vueuse/patch';
import type { SignalOrGetter } from '../utils/types';
import { toValue } from '../utils/general';

export declare type WatchArrayCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV,
  added: V,
  removed: OV,
  onCleanup: (cleanupFn: () => void) => void,
) => any;

/**
 * Watch for an array with additions and removals.
 *
 * @see https://vueuse.org/watchArray
 */
export function watchArray<T, Immediate extends Readonly<boolean> = false>(
  source: SignalOrGetter<T[]> | T[],
  cb: WatchArrayCallback<T[], Immediate extends true ? T[] | undefined : T[]>,
  options: { immediate?: Immediate; deep?: boolean } = {},
): WatchHandle {
  let oldList: T[] = options?.immediate ? [] : [...(toValue(source) as T[])];

  return watch(
    source as () => T[],
    (newList, _, onCleanup) => {
      const oldListRemains = Array.from({ length: oldList.length });
      const added: T[] = [];
      for (const obj of newList) {
        let found = false;
        for (let i = 0; i < oldList.length; i++) {
          if (!oldListRemains[i] && obj === oldList[i]) {
            oldListRemains[i] = true;
            found = true;
            break;
          }
        }
        if (!found) added.push(obj);
      }
      const removed = oldList.filter((_, i) => !oldListRemains[i]);

      cb(newList, oldList, added, removed, onCleanup as (cleanupFn: () => void) => void);
      oldList = [...newList];
    },
    { immediate: options?.immediate as boolean | undefined },
  );
}
