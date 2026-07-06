import {
  Directive,
  Input,
  Output,
  ElementRef,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  EventEmitter,
} from '@angular/core';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { useEventListener } from '../useEventListener';
import type { Fn } from '@cyia/ngx-vueuse/shared';
import { createKeyPredicate as _createKeyPredicate } from './onKeyStroke';
import type { KeyFilter, OnKeyStrokeOptions } from './onKeyStroke';

export { _createKeyPredicate as createKeyPredicate };
export type {
  KeyPredicate,
  KeyFilter,
  KeyStrokeEventName,
  OnKeyStrokeOptions,
} from './onKeyStroke';

type BindingValueFunction = (event: KeyboardEvent) => void;

type BindingValueArray = [BindingValueFunction, OnKeyStrokeOptions];

/**
 * Angular directive that listens for keyboard keystrokes.
 *
 * Usage:
 * ```html
 * <!-- Basic usage - listen to any key -->
 * <button ngxOnKeyStroke="handleKey">Press any key</button>
 *
 * <!-- Listen to specific key -->
 * <input ngxOnKeyStroke.enter="handleEnter" />
 *
 * <!-- Listen to multiple keys -->
 * <div [ngxOnKeyStroke]="['Escape', 'Backspace']" (ngxOnKeyStrokeEvent)="handleKey($event)">
 *   Press Escape or Backspace
 * </div>
 *
 * <!-- With options -->
 * <input [ngxOnKeyStrokeOptions]="{ eventName: 'keyup', dedupe: true }" ngxOnKeyStroke="handleKey" />
 * ```
 */
@Directive({
  selector: '[ngxOnKeyStroke]',
  standalone: true,
})
export class NgxOnKeyStrokeDirective implements OnInit, OnChanges, OnDestroy {
  private el = inject(ElementRef);
  private cleanups: Fn[] = [];

  /**
   * The handler function to call when a key is pressed.
   * Can also be an array of [handler, options].
   */
  @Input() ngxOnKeyStroke: BindingValueFunction | BindingValueArray = ((
    event: KeyboardEvent,
  ) => {}) as BindingValueFunction;

  /**
   * The key(s) to listen for. Can be:
   * - A single key string (e.g., 'Enter', 'Escape')
   * - An array of keys
   * - true to listen to any key (default)
   */
  @Input() ngxKeyFilter: KeyFilter = true;

  /**
   * Options for the key stroke listener.
   */
  @Input() ngxOnKeyStrokeOptions: OnKeyStrokeOptions = {};

  /**
   * Output event emitted when a key is pressed.
   */
  @Output() ngxOnKeyStrokeEvent = new EventEmitter<KeyboardEvent>();

  ngOnInit(): void {
    this.setupListener(this.ngxKeyFilter, this.ngxOnKeyStroke);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only re-setup if the relevant inputs changed
    if (!changes['ngxOnKeyStroke'] && !changes['ngxKeyFilter'] && !changes['ngxOnKeyStrokeOptions'])
      return;
    this.setupListener(this.ngxKeyFilter, this.ngxOnKeyStroke);
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
  }

  private createHandler(value: BindingValueFunction | BindingValueArray) {
    return (e: KeyboardEvent) => {
      if (typeof value === 'function') {
        value(e);
      } else {
        const [handlerFn] = value;
        handlerFn(e);
      }
      this.ngxOnKeyStrokeEvent.emit(e);
    };
  }

  private setupListener(
    keyFilter: KeyFilter,
    value: BindingValueFunction | BindingValueArray,
  ): void {
    // Clean up previous listener
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];

    const { eventName = 'keydown', passive = false, dedupe = false } = this.ngxOnKeyStrokeOptions;

    const predicate = _createKeyPredicate(keyFilter);
    const handler = this.createHandler(value);

    const listener = (e: KeyboardEvent) => {
      if (e.repeat && toValue(dedupe)) return;

      if (predicate(e)) {
        handler(e);
      }
    };

    const cleanup = useEventListener(this.el.nativeElement, eventName, listener, passive);

    this.cleanups.push(cleanup);
  }
}
