import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
} from '@angular/core';

import { isIOS, noop } from '@cyia/ngx-vueuse/shared';
import { toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { unrefElement, type MaybeElement, type MaybeComputedElementRef } from '../unrefElement';

type Fn = () => void;

export const WINDOW = new InjectionToken<Window | undefined>('Window token', {
  providedIn: 'root',
  factory: () => (typeof window !== 'undefined' ? window : undefined),
});

type SignalOrGetter<T> = T | (() => T);
type Arrayable<T> = T | T[];
type MaybeRefOrGetter<T> = SignalOrGetter<T>;
type MaybeElementRef = MaybeElement | string;

export interface OnClickOutsideOptions {
  /**
   * List of elements that should not trigger the event,
   * provided as Refs or CSS Selectors.
   */
  ignore?: MaybeRefOrGetter<Arrayable<MaybeElementRef>>;
  /**
   * Use capturing phase for internal event listener.
   * @default true
   */
  capture?: boolean;
  /**
   * Run handler function if focus moves to an iframe.
   * @default false
   */
  detectIframe?: boolean;
}

export type OnClickOutsideHandler = (event: Event | PointerEvent) => void;

/**
 * Directive that detects clicks outside of the element it's attached to.
 *
 * @example
 * ```html
 * <div ngxOnClickOutside="onOutsideClick">
 *   Click inside or outside
 * </div>
 * ```
 *
 * @example
 * With options:
 * ```html
 * <div
 *   [ngxOnClickOutside]="onOutsideClick"
 *   [ngxOnClickOutsideOptions]="{ ignore: [ignoreEl, '.ignore-class'] }"
 * >
 *   Content
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxOnClickOutside]',
  standalone: true,
})
export class NgxOnClickOutsideDirective {
  /**
   * Handler function or event emitter for outside clicks.
   * Can be a function reference or bound to an EventEmitter.
   */
  @Input() ngxOnClickOutside: OnClickOutsideHandler | EventEmitter<Event> = function (
    event: Event | PointerEvent,
  ): void {
    void event;
  } as OnClickOutsideHandler;

  /**
   * Options for configuring the outside click detection.
   */
  @Input() ngxOnClickOutsideOptions: OnClickOutsideOptions = {};

  private _window: Window | undefined;
  private _cleanupFns: Fn[] = [];
  private _shouldListen = true;
  private _isProcessingClick = false;
  private static _iOSWorkaroundApplied = false;

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    @Inject(WINDOW) private _win: Window | undefined,
    private _zone: NgZone,
  ) {
    this._window = this._win ?? defaultWindow;
  }

  ngOnInit() {
    this._setup();
  }

  ngOnDestroy() {
    this._teardown();
  }

  private _setup() {
    if (!this._window) return;

    // iOS workaround: add noop click listeners to body children
    // Fixes: https://github.com/vueuse/vueuse/issues/1520
    if (isIOS && !NgxOnClickOutsideDirective._iOSWorkaroundApplied) {
      NgxOnClickOutsideDirective._iOSWorkaroundApplied = true;
      const listenerOptions: AddEventListenerOptions = { passive: true };
      Array.from(this._window.document.body.children).forEach((el) =>
        el.addEventListener('click', noop, listenerOptions),
      );
      this._window.document.documentElement.addEventListener('click', noop, listenerOptions);
    }

    const { ignore = [], capture = true, detectIframe = false } = this._normalizeOptions();

    const shouldIgnore = (event: Event): boolean => {
      const ignoreList = toValue(ignore) as Array<MaybeElementRef>;
      return ignoreList.some((target: MaybeElementRef) => {
        if (typeof target === 'string') {
          return Array.from(this._window!.document.querySelectorAll(target)).some(
            (el) => el === event.target || event.composedPath().includes(el),
          );
        } else {
          const el = unrefElement(target as MaybeComputedElementRef<MaybeElement>);
          return el && (event.target === el || event.composedPath().includes(el));
        }
      });
    };

    const el = this._elementRef.nativeElement;

    const handler = (event: Event) => {
      if (event.target == null) return;

      if (!el || el === event.target || event.composedPath().includes(el)) return;

      if ('detail' in event && event.detail === 0) this._shouldListen = !shouldIgnore(event);

      if (!this._shouldListen) {
        this._shouldListen = true;
        return;
      }

      this._invokeHandler(event);
    };

    // Click listener with capture phase
    const handleClick = (event: Event) => {
      if (!this._isProcessingClick) {
        this._isProcessingClick = true;
        setTimeout(() => {
          this._isProcessingClick = false;
        }, 0);
        this._zone.runOutsideAngular(() => {
          handler(event);
        });
      }
    };

    // Pointerdown listener to determine if we should listen
    const handlePointerDown = (e: Event) => {
      this._shouldListen = !shouldIgnore(e) && !!(el && !e.composedPath().includes(el));
    };

    // Iframe detection listener
    let handleBlur: ((event: Event) => void) | undefined;
    if (detectIframe) {
      handleBlur = (event: Event) => {
        setTimeout(() => {
          const activeEl: Element | null | undefined = this._window!.document.activeElement;
          let currentEl: Element | null | undefined = activeEl;
          while (currentEl?.shadowRoot) currentEl = currentEl.shadowRoot.activeElement;

          if (
            currentEl?.tagName === 'IFRAME' &&
            !el?.contains(this._window!.document.activeElement as Node | null)
          ) {
            this._zone.runOutsideAngular(() => {
              this._invokeHandler(event);
            });
          }
        }, 0);
      };
    }

    // Register event listeners
    this._cleanupFns.push(
      this._addEventListener(this._window, 'click', handleClick as EventListener, {
        passive: true,
        capture,
      }),
      this._addEventListener(this._window, 'pointerdown', handlePointerDown, { passive: true }),
      handleBlur
        ? this._addEventListener(this._window, 'blur', handleBlur as EventListener, {
            passive: true,
          })
        : noop,
    );
  }

  private _normalizeOptions(): OnClickOutsideOptions {
    return {
      ignore: this.ngxOnClickOutsideOptions.ignore ?? [],
      capture: this.ngxOnClickOutsideOptions.capture ?? true,
      detectIframe: this.ngxOnClickOutsideOptions.detectIframe ?? false,
    };
  }

  private _invokeHandler(event: Event) {
    const handler = this.ngxOnClickOutside;
    if (handler instanceof EventEmitter) {
      handler.emit(event);
    } else {
      (handler as OnClickOutsideHandler)(event);
    }
  }

  private _teardown() {
    this._cleanupFns.forEach((fn) => fn());
    this._cleanupFns = [];
    this._shouldListen = true;
    this._isProcessingClick = false;
  }

  private _addEventListener(
    target: Window | Document,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): Fn {
    target.addEventListener(event, handler, options);
    return () => {
      target.removeEventListener(event, handler, options);
    };
  }
}
