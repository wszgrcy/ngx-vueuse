import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  EventEmitter,
  inject,
} from '@angular/core';

import { defaultWindow } from '../_configurable';

export interface ElementSize {
  width: number;
  height: number;
}

export interface UseElementSizeOptions {
  /**
   * Which box model to use for size calculation.
   * @default 'content-box'
   */
  box?: 'content-box' | 'border-box' | 'device-pixel-content-box';
  /**
   * The window to use for size detection.
   */
  window?: Window | undefined;
}

export type ElementSizeHandler = (size: ElementSize) => void;

/**
 * Angular directive that tracks the size of an element using ResizeObserver.
 *
 * @example
 * ```html
 * <!-- Basic usage - emit size changes -->
 * <div (ngxUseElementSize)="onSizeChange($event)">
 *   Content
 * </div>
 *
 * <!-- With options -->
 * <div
 *   [ngxUseElementSize]="onSizeChange"
 *   [ngxUseElementSizeOptions]="{ box: 'border-box' }"
 * >
 *   Content
 * </div>
 *
 * <!-- With initial size -->
 * <div
 *   [ngxUseElementSize]="onSizeChange"
 *   [ngxUseElementSizeOptions]="{ box: 'content-box' }"
 *   [initialSize]="{ width: 100, height: 100 }"
 * >
 *   Content
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxUseElementSize]',
  standalone: true,
})
export class NgxUseElementSizeDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private _window: Window | undefined;

  /**
   * Handler function or event emitter for size changes.
   * Can be a function reference that receives ElementSize,
   * or an array of [handler, options].
   */
  @Input() ngxUseElementSize: ElementSizeHandler | EventEmitter<ElementSize> = ((
    size: ElementSize,
  ) => {}) as ElementSizeHandler;

  /**
   * Options for configuring size detection.
   */
  @Input() ngxUseElementSizeOptions: UseElementSizeOptions = {};

  /**
   * Initial size values before the element is observed.
   */
  @Input() initialSize: ElementSize = { width: 0, height: 0 };

  constructor() {
    this._window = inject('WINDOW' as any, { optional: true }) ?? undefined;
  }

  ngOnInit(): void {
    this.setupSizeObserver();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupSizeObserver(): void {
    const el = this.el.nativeElement;
    if (!el) return;

    const { box = 'content-box', window: win = this._window ?? defaultWindow } =
      this.ngxUseElementSizeOptions;
    const initialW = this.initialSize.width ?? 0;
    const initialH = this.initialSize.height ?? 0;

    // Create signals for width and height
    let currentWidth = initialW;
    let currentHeight = initialH;

    // Get handler function from input
    const emitter = this.ngxUseElementSize instanceof EventEmitter ? this.ngxUseElementSize : null;
    const handler: ElementSizeHandler =
      typeof this.ngxUseElementSize === 'function'
        ? (this.ngxUseElementSize as ElementSizeHandler)
        : (size: ElementSize) => {
            emitter?.emit(size);
          };

    // Use ResizeObserver to track element size
    const window_ = win;
    const resizeCallback = (entries: globalThis.ResizeObserverEntry[]) => {
      const entry = entries[0];
      const boxModel =
        box === 'border-box'
          ? entry.borderBoxSize
          : box === 'content-box'
            ? entry.contentBoxSize
            : entry.devicePixelContentBoxSize;

      // Check if element is SVG
      const isSVG = el.namespaceURI?.includes('svg') ?? false;

      if (win && isSVG) {
        const rect = el.getBoundingClientRect();
        currentWidth = rect.width;
        currentHeight = rect.height;
      } else if (boxModel) {
        // boxModel is an array of ResizeObserverSize
        const boxSizes = Array.isArray(boxModel) ? boxModel : [boxModel];
        currentWidth = boxSizes.reduce((acc, { inlineSize }) => acc + inlineSize, 0);
        currentHeight = boxSizes.reduce((acc, { blockSize }) => acc + blockSize, 0);
      } else {
        // Fallback to contentRect
        currentWidth = entry.contentRect.width;
        currentHeight = entry.contentRect.height;
      }

      // Call handler with current size
      handler({ width: currentWidth, height: currentHeight });
    };

    // Create ResizeObserver instance
    let observer: ResizeObserver | null = null;
    if (window_ && 'ResizeObserver' in window_) {
      observer = new (window_ as any).ResizeObserver(resizeCallback);
      observer?.observe(el);
    }

    // Store observer for cleanup
    (this as any)._resizeObserver = observer;

    // Set initial size from offsetWidth/offsetHeight if element is available
    if ('offsetWidth' in el) {
      currentWidth = el.offsetWidth;
      currentHeight = el.offsetHeight;
      handler({ width: currentWidth, height: currentHeight });
    }
  }

  private cleanup(): void {
    if ((this as any)._resizeObserver) {
      try {
        (this as any)._resizeObserver.disconnect();
      } catch {
        // Ignore cleanup errors
      }
      (this as any)._resizeObserver = null;
    }
  }
}
