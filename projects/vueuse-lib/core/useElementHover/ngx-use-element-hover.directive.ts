import {
  Directive,
  ElementRef,
  input,
  output,
  inject,
  untracked,
  runInInjectionContext,
  Injector,
} from '@angular/core';
import { useElementHover } from './index';
import { effect } from '@angular/core';

export interface UseElementHoverOptions {
  /**
   * Delay in milliseconds to wait before setting hovered state to true
   * @default 0
   */
  delayEnter?: number;

  /**
   * Delay in milliseconds to wait before setting hovered state to false
   * @default 0
   */
  delayLeave?: number;

  /**
   * Whether to trigger the leave callback when the element is removed from the DOM
   * @default false
   */
  triggerOnRemoval?: boolean;
}

export type UseElementHoverReturn = boolean;

/**
 * Directive that detects when the mouse hovers over an element.
 *
 * @example
 * ```html
 * <div ngxUseElementHover="onHoverChange">
 *   Hover over me
 * </div>
 * ```
 *
 * @example
 * With options:
 * ```html
 * <div
 *   [ngxUseElementHover]="onHoverChange"
 *   [ngxUseElementHoverOptions]="{ delayEnter: 100, delayLeave: 200 }"
 * >
 *   Content
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxUseElementHover]',
  standalone: true,
})
export class NgxUseElementHoverDirective {
  /**
   * Emitter that emits the hover state (true when hovering, false when not).
   * Can be used as an alternative to providing a callback function via ngxUseElementHover.
   */
  readonly ngxUseElementHover = output<boolean>();

  /**
   * Handler function or event emitter for hover state changes.
   * Can be a function reference or bound to an EventEmitter.
   */
  readonly ngxUseElementHoverHandler = input<((state: boolean) => void) | undefined>();

  /**
   * Options for configuring the hover detection behavior.
   */
  readonly ngxUseElementHoverOptions = input<UseElementHoverOptions>({});

  private _isHoveredSignal: ReturnType<typeof useElementHover> | undefined;

  /**
   * Whether the element is currently being hovered.
   */
  get isHovered(): boolean {
    return this._isHoveredSignal?.() ?? false;
  }

  readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  injector = inject(Injector);

  constructor() {
    const el = this.elementRef.nativeElement;
    effect(() => {
      const handler = this.ngxUseElementHoverHandler();
      const options = this.ngxUseElementHoverOptions();

      untracked(() => {
        runInInjectionContext(this.injector, () => {
          if (typeof handler === 'function') {
            this._isHoveredSignal = useElementHover(el, options);
            effect(() => {
              handler(this._isHoveredSignal!());
            });
          } else {
            this._isHoveredSignal = useElementHover(el);
            effect(() => {
              this.ngxUseElementHover.emit(this._isHoveredSignal!());
            });
          }
        });
      });
    });
  }
}
