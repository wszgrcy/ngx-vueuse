import type { Signal } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { CloneFn } from '../useCloned';
import { cloneFnJSON } from '../useCloned';
import { timestamp } from '@cyia/ngx-vueuse/shared';

export interface UseRefHistoryRecord<T> {
  snapshot: T;
  timestamp: number;
}

export interface UseManualRefHistoryOptions<Raw, Serialized = Raw> {
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
   * set data source
   */
  setSource?: (source: Signal<Raw>, v: Raw) => void;
}

export interface UseManualRefHistoryReturn<Raw, Serialized> {
  /**
   * Bypassed tracking ref from the argument
   */
  source: Signal<Raw>;

  /**
   * An array of history records for undo, newest comes to first
   */
  history: Signal<UseRefHistoryRecord<Serialized>[]>;

  /**
   * Last history point, source can be different if paused
   */
  last: Signal<UseRefHistoryRecord<Serialized>>;

  /**
   * Same as {@link UseManualRefHistoryReturn.history | history}
   */
  undoStack: Signal<UseRefHistoryRecord<Serialized>[]>;

  /**
   * Records array for redo
   */
  redoStack: Signal<UseRefHistoryRecord<Serialized>[]>;

  /**
   * A ref representing if undo is possible (non empty undoStack)
   */
  canUndo: Signal<boolean>;

  /**
   * A ref representing if redo is possible (non empty redoStack)
   */
  canRedo: Signal<boolean>;

  /**
   * Undo changes
   */
  undo: () => void;

  /**
   * Redo changes
   */
  redo: () => void;

  /**
   * Clear all the history
   */
  clear: () => void;

  /**
   * Create a new history record
   */
  commit: () => void;

  /**
   * Reset ref's value with latest history
   */
  reset: () => void;
}

function fnBypass<F, T>(v: F) {
  return v as unknown as T;
}
function fnSetSource<F>(source: Signal<F>, value: F) {
  return (source as any).set(value);
}

type FnCloneOrBypass<F, T> = (v: F) => T;

function defaultDump<R, S>(clone?: boolean | CloneFn<R>) {
  return (clone
    ? typeof clone === 'function'
      ? clone
      : cloneFnJSON
    : fnBypass) as unknown as FnCloneOrBypass<R, S>;
}

function defaultParse<R, S>(clone?: boolean | CloneFn<R>) {
  return (clone
    ? typeof clone === 'function'
      ? clone
      : cloneFnJSON
    : fnBypass) as unknown as FnCloneOrBypass<S, R>;
}

/**
 * Track the change history of a ref, also provides undo and redo functionality.
 *
 * @see https://vueuse.org/useManualRefHistory
 * @param source
 * @param options
 */
export function useManualRefHistory<Raw, Serialized = Raw>(
  source: Signal<Raw>,
  options: UseManualRefHistoryOptions<Raw, Serialized> = {},
): UseManualRefHistoryReturn<Raw, Serialized> {
  const {
    clone = false,
    dump = defaultDump<Raw, Serialized>(clone),
    parse = defaultParse<Raw, Serialized>(clone),
    setSource = fnSetSource,
  } = options;

  function _createHistoryRecord(): UseRefHistoryRecord<Serialized> {
    return {
      snapshot: dump(source()),
      timestamp: timestamp(),
    };
  }

  const last = signal(_createHistoryRecord());
  const undoStack = signal<UseRefHistoryRecord<Serialized>[]>([]);
  const redoStack = signal<UseRefHistoryRecord<Serialized>[]>([]);

  const _setSource = (record: UseRefHistoryRecord<Serialized>) => {
    setSource(source as any, parse(record.snapshot));
    last.set(record);
  };

  const commit = () => {
    const currentUndo = undoStack();
    const currentRedo = redoStack();

    undoStack.set([last(), ...currentUndo]);
    last.set(_createHistoryRecord());

    if (options.capacity && undoStack().length > options.capacity!) {
      undoStack.set(undoStack().slice(0, options.capacity!));
    }
    if (currentRedo.length) {
      redoStack.set([]);
    }
  };

  const clear = () => {
    undoStack.set([]);
    redoStack.set([]);
  };

  const undo = () => {
    const currentUndo = undoStack();
    const currentRedo = redoStack();
    const state = currentUndo[0];

    if (state) {
      undoStack.set(currentUndo.slice(1));
      redoStack.set([last(), ...currentRedo]);
      _setSource(state);
    }
  };

  const redo = () => {
    const currentUndo = undoStack();
    const currentRedo = redoStack();
    const state = currentRedo[0];

    if (state) {
      redoStack.set(currentRedo.slice(1));
      undoStack.set([last(), ...currentUndo]);
      _setSource(state);
    }
  };

  const reset = () => {
    _setSource(last());
  };

  const history = computed(() => [last(), ...undoStack()]);

  const canUndo = computed(() => undoStack().length > 0);
  const canRedo = computed(() => redoStack().length > 0);

  return {
    source,
    history,
    last,
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    commit,
    reset,
  };
}
