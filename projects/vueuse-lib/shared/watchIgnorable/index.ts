import type { Signal } from '@angular/core';
import type { Fn } from '../utils/types';
import type { EventFilter } from '../utils/filters';
import { watch } from '@cyia/ngx-vueuse/patch';

//

export type IgnoredUpdater = (updater: () => void) => void;
export type IgnoredPrevAsyncUpdates = () => void;

export interface WatchIgnorableReturn {
  ignoreUpdates: IgnoredUpdater;
  ignorePrevAsyncUpdates: IgnoredPrevAsyncUpdates;
  stop: Fn;
}

import type { WatchWithFilterOptions } from '../watchWithFilter';

const bypassFilter: EventFilter = (invoke) => invoke();

function createFilterWrapper(filter: EventFilter, fn: Fn) {
  return function (...args: any[]) {
    return filter(fn, { fn, args, thisArg: undefined });
  };
}

/**
 * Watch a source with the ability to ignore updates.
 * Returns an `ignoreUpdates` function that can be used to update the source
 * without triggering the callback.
 *
 * @param source
 * @param callback
 * @param options
 */
export function watchIgnorable<T>(
  source: Signal<T> | (() => T) | T,
  callback: (value: T, oldValue?: T) => void,
  options: WatchWithFilterOptions<false> = {},
): WatchIgnorableReturn {
  const { eventFilter = bypassFilter, flush = 'post', immediate = false } = options;

  const filteredCb = createFilterWrapper(eventFilter, () => callback(undefined as any));

  let stop: Fn;

  if (flush === 'sync') {
    let ignore = false;

    const ignorePrevAsyncUpdates: IgnoredPrevAsyncUpdates = () => {};

    const ignoreUpdates: IgnoredUpdater = (updater: () => void) => {
      // Call the updater function and count how many sync updates are performed,
      // then add them to the ignore count
      ignore = true;
      updater();
      ignore = false;
    };

    stop = watch(source, () => {
      if (!ignore) filteredCb();
    }) as unknown as Fn;

    return { stop, ignoreUpdates, ignorePrevAsyncUpdates };
  } else {
    // flush 'pre' and 'post'

    const disposables: Array<() => void> = [];

    // counters for how many following changes to be ignored
    // ignoreCounter is incremented before there is a history operation
    // affecting the source ref value (undo, redo, revert).
    // syncCounter is incremented in sync with every change to the
    // source ref value. This let us know how many times the ref
    // was modified and support chained sync operations. If there
    // are more sync triggers than the ignore count, the we now
    // there are modifications in the source ref value that we
    // need to commit
    let ignoreCounter = 0;
    let syncCounter = 0;

    const ignorePrevAsyncUpdates: IgnoredPrevAsyncUpdates = () => {
      ignoreCounter = syncCounter;
    };

    const ignoreUpdates: IgnoredUpdater = (updater: () => void) => {
      // Call the updater function and count how many sync updates are performed,
      // then add them to the ignore count
      const syncCounterPrev = syncCounter;
      updater();
      ignoreCounter += syncCounter - syncCounterPrev;
    };

    // Counter watch to count modifications to the source
    disposables.push(
      watch(source, () => {
        syncCounter++;
      }),
    );

    // Callback watch with filter logic
    disposables.push(
      watch(
        source,
        () => {
          // If a history operation was performed (ignoreCounter > 0) and there are
          // no other changes to the source ref value afterwards, then ignore this commit
          const ignore = ignoreCounter > 0 && ignoreCounter === syncCounter;
          ignoreCounter = 0;
          syncCounter = 0;
          if (ignore) return;

          filteredCb();
        },
        { immediate },
      ),
    );

    stop = () => {
      disposables.forEach((fn) => fn());
    };

    return { stop, ignoreUpdates, ignorePrevAsyncUpdates };
  }
}
