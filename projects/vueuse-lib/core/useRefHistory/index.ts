import type { Signal } from '@angular/core';
import type { Fn } from '@cyia/ngx-vueuse/shared';
// Inline CloneFn type definition since useCloned is not fully migrated
type CloneFn<F, T = F> = (x: F) => T;
import type { UseManualRefHistoryReturn } from '../useManualRefHistory';
import { pausableFilter } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableEventFilter, ConfigurableFlush } from '@cyia/ngx-vueuse/shared';
import { watchIgnorable } from '@cyia/ngx-vueuse/shared';
import { useManualRefHistory } from '../useManualRefHistory';

export interface UseRefHistoryOptions<Raw, Serialized = Raw>
  extends ConfigurableEventFilter, ConfigurableFlush {
  /**
   * Watch for deep changes, default to false
   *
   * When set to true, it will also create clones for values store in the history
   *
   * @default false
   */
  deep?: boolean;

  /**
   * Maximum number of history to be kept. Default to unlimited.
   */
  capacity?: number;

  /**
   * Clone when taking a snapshot, shortcut for dump: JSON.parse(JSON.stringify(value)).
   * Default to false
   *
   * @default false
   */
  clone?: boolean | CloneFn<Raw>;
  /**
   * Serialize data into the history
   */
  dump?: (v: Raw) => Serialized;
  /**
   * Deserialize data from the history
   */
  parse?: (v: Serialized) => Raw;
  /**
   * Function to determine if the commit should proceed
   * @param oldValue Previous value
   * @param newValue New value
   * @returns boolean indicating if commit should proceed
   */
  shouldCommit?: (oldValue: Raw | undefined, newValue: Raw) => boolean;
}

export interface UseRefHistoryReturn<Raw, Serialized> extends UseManualRefHistoryReturn<
  Raw,
  Serialized
> {
  /**
   * A ref representing if the tracking is enabled
   */
  isTracking: Signal<boolean>;

  /**
   * Pause change tracking
   */
  pause: () => void;

  /**
   * Resume change tracking
   *
   * @param [commit] if true, a history record will be create after resuming
   */
  resume: (commit?: boolean) => void;

  /**
   * A sugar for auto pause and auto resuming within a function scope
   *
   * @param fn
   */
  batch: (fn: (cancel: Fn) => void) => void;

  /**
   * Clear the data and stop the watch
   */
  dispose: () => void;
}

/**
 * Track the change history of a ref, also provides undo and redo functionality.
 *
 * @see https://vueuse.org/useRefHistory
 * @param source
 * @param options
 */
export function useRefHistory<Raw, Serialized = Raw>(
  source: Signal<Raw>,
  options: UseRefHistoryOptions<Raw, Serialized> = {},
): UseRefHistoryReturn<Raw, Serialized> {
  const { deep = false, flush = 'pre', eventFilter, shouldCommit = () => true } = options;

  const {
    eventFilter: composedFilter,
    pause,
    resume: resumeTracking,
    isActive: isTracking,
  } = pausableFilter(eventFilter);

  // Track the last raw value for shouldCommit comparison
  let lastRawValue: Raw | undefined = source();

  const { ignoreUpdates, ignorePrevAsyncUpdates, stop } = watchIgnorable(source, commit, {
    flush,
    eventFilter: composedFilter,
  });

  function setSource(source: Signal<Raw>, value: Raw) {
    // Support changes that are done after the last history operation
    // examples:
    //   undo, modify
    //   undo, undo, modify
    // If there were already changes in the state, they will be ignored
    // examples:
    //   modify, undo
    //   undo, modify, undo
    ignorePrevAsyncUpdates();

    ignoreUpdates(() => {
      (source as any).set(value);
      lastRawValue = value;
    });
  }

  const manualHistory = useManualRefHistory(source, {
    ...options,
    clone: options.clone || deep,
    setSource,
  });

  const { clear, commit: manualCommit } = manualHistory;

  function commit() {
    // This guard only applies for flush 'pre' and 'post'
    // If the user triggers a commit manually, then reset the watcher
    // so we do not trigger an extra commit in the async watcher
    ignorePrevAsyncUpdates();

    if (!shouldCommit(lastRawValue, source())) return;

    lastRawValue = source();
    manualCommit();
  }

  function resume(commitNow?: boolean) {
    resumeTracking();
    if (commitNow) commit();
  }

  function batch(fn: (cancel: Fn) => void) {
    let canceled = false;

    const cancel = () => (canceled = true);

    ignoreUpdates(() => {
      fn(cancel);
    });

    if (!canceled) commit();
  }

  function dispose() {
    stop();
    clear();
  }

  return {
    ...manualHistory,
    isTracking: isTracking as Signal<boolean>,
    pause,
    resume,
    commit,
    batch,
    dispose,
  };
}
