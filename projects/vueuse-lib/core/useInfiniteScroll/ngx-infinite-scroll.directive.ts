import { Directive, ElementRef, Input, Inject, InjectionToken, Optional } from '@angular/core';
import { useInfiniteScroll, type UseInfiniteScrollOptions } from './index';
import { defaultWindow } from '../_configurable';

export const WINDOW = new InjectionToken<Window | undefined>('Window token', {
  providedIn: 'root',
  factory: () => (typeof window !== 'undefined' ? window : undefined),
});

type Handler = (state: any) => Promise<void> | void;
type HandlerWithOptions = [Handler, UseInfiniteScrollOptions];

@Directive({
  selector: '[ngxInfiniteScroll]',
  standalone: true,
})
export class NgxInfiniteScrollDirective {
  /**
   * The handler function or array of [handler, options].
   */
  @Input() ngxInfiniteScroll: Handler | HandlerWithOptions = () => {};

  /**
   * Options for configuring infinite scroll.
   * Only used when ngxInfiniteScroll is a function.
   */
  @Input() ngxInfiniteScrollOptions: UseInfiniteScrollOptions = {};

  private _window: Window | undefined;

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    @Inject(WINDOW) @Optional() win: Window | undefined,
  ) {
    this._window = win ?? defaultWindow;
    const el = this._elementRef.nativeElement as HTMLElement;
    const value = this.ngxInfiniteScroll;

    if (typeof value === 'function') {
      useInfiniteScroll(el, value, this.ngxInfiniteScrollOptions);
    } else {
      useInfiniteScroll(el, value[0], value[1]);
    }
  }
}
