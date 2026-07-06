import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { useEventListener } from '../useEventListener';
import type { Fn } from '@cyia/ngx-vueuse/shared';

const DEFAULT_DELAY = 500;
const DEFAULT_THRESHOLD = 10;

export interface Position {
  x: number;
  y: number;
}

export interface OnLongPressOptions {
  /**
   * Time in ms till `longpress` gets called
   *
   * @default 500
   */
  delay?: number | ((ev: PointerEvent) => number);

  /**
   * Allowance of moving distance in pixels,
   * The action will get cancelled When moving too far from the pointerdown position.
   * @default 10
   */
  distanceThreshold?: number | false;

  /**
   * Function called when the ref element is released.
   * @param duration how long the element was pressed in ms
   * @param distance distance from the pointerdown position
   * @param isLongPress whether the action was a long press or not
   * @param pointerEvent the native {@link PointerEvent} triggered by the browser
   */
  onMouseUp?: (
    duration: number,
    distance: number,
    isLongPress: boolean,
    pointerEvent: PointerEvent,
  ) => void;

  /**
   * Whether to stop propagation
   */
  stop?: boolean;

  /**
   * Whether to listen only once
   */
  once?: boolean;

  /**
   * Whether to prevent default
   */
  prevent?: boolean;

  /**
   * Whether to use capture mode
   */
  capture?: boolean;

  /**
   * Whether to only trigger when the event target matches the element itself
   */
  self?: boolean;
}

export type OnLongPressReturn = () => void;

@Directive({
  selector: '[ngxOnLongPress]',
  standalone: true,
})
export class NgxOnLongPressDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);

  /**
   * The callback function to be called when a long press is detected.
   */
  @Input() ngxOnLongPress!: (evt: PointerEvent) => void;

  /**
   * Options for configuring the long press behavior.
   */
  @Input() ngxOnLongPressOptions: OnLongPressOptions = {};

  private stopListeners: Fn | undefined;

  ngOnInit(): void {
    this.setupLongPress();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupLongPress(): void {
    const element = this.elementRef.nativeElement as HTMLElement;
    const options = this.ngxOnLongPressOptions;
    const handler = this.ngxOnLongPress;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let posStart: Position | undefined;
    let startTimestamp: number | undefined;
    let hasLongPressed = false;

    const clear = (): void => {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      posStart = undefined;
      startTimestamp = undefined;
      hasLongPressed = false;
    };

    const getDelay = (ev: PointerEvent): number => {
      const delay = options?.delay;
      if (typeof delay === 'function') {
        return delay(ev);
      }
      return delay ?? DEFAULT_DELAY;
    };

    const onRelease = (ev: PointerEvent): void => {
      const _startTimestamp = startTimestamp;
      const _posStart = posStart;
      const _hasLongPressed = hasLongPressed;
      clear();

      if (!options?.onMouseUp || !_posStart || !_startTimestamp) return;

      if (options?.self && ev.target !== element) return;

      if (options?.prevent) ev.preventDefault();

      if (options?.stop) ev.stopPropagation();

      const dx = ev.x - _posStart.x;
      const dy = ev.y - _posStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      options.onMouseUp!(ev.timeStamp - _startTimestamp, distance, _hasLongPressed, ev);
    };

    const onDown = (ev: PointerEvent): void => {
      if (options?.self && ev.target !== element) return;

      clear();

      if (options?.prevent) ev.preventDefault();

      if (options?.stop) ev.stopPropagation();

      posStart = {
        x: ev.x,
        y: ev.y,
      };
      startTimestamp = ev.timeStamp;
      timeout = setTimeout(() => {
        hasLongPressed = true;
        handler(ev);
      }, getDelay(ev));
    };

    const onMove = (ev: PointerEvent): void => {
      if (options?.self && ev.target !== element) return;

      if (!posStart || options?.distanceThreshold === false) return;

      if (options?.prevent) ev.preventDefault();

      if (options?.stop) ev.stopPropagation();

      const dx = ev.x - posStart.x;
      const dy = ev.y - posStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance >= (options?.distanceThreshold ?? DEFAULT_THRESHOLD)) clear();
    };

    const listenerOptions: AddEventListenerOptions = {
      capture: options?.capture,
      once: options?.once,
    };

    const cleanups = [
      useEventListener(element, 'pointerdown', onDown, listenerOptions),
      useEventListener(element, 'pointermove', onMove, listenerOptions),
      useEventListener(element, ['pointerup', 'pointerleave'], onRelease, listenerOptions),
    ];

    this.stopListeners = () => {
      cleanups.forEach((fn) => fn());
    };
  }

  private cleanup(): void {
    if (this.stopListeners) {
      this.stopListeners();
      this.stopListeners = undefined;
    }
  }
}
