import type { Signal } from '@angular/core';
import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';

export interface UseClipboardItemsOptions<Source> extends ConfigurableNavigator {
  /**
   * Enabled reading for clipboard
   *
   * @default false
   */
  read?: boolean;

  /**
   * Copy source
   */
  source?: Source;

  /**
   * Milliseconds to reset state of `copied` signal
   *
   * @default 1500
   */
  copiedDuring?: number;
}

export interface UseClipboardItemsReturn<Optional> extends Supportable {
  content: Signal<ClipboardItems>;
  copied: Signal<boolean>;
  copy: Optional extends true
    ? (content?: ClipboardItems) => Promise<void>
    : (text: ClipboardItems) => Promise<void>;
  read: () => void;
}
