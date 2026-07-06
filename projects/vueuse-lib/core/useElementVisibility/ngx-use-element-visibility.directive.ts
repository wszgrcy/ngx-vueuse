import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  Output,
} from '@angular/core';

import { defaultWindow } from '../_configurable';
import { unrefElement, type MaybeComputedElementRef } from '../unrefElement';

export const WINDOW = new InjectionToken<Window | undefined>('Window token', {
  providedIn: 'root',
  factory: () => (typeof window !== 'undefined' ? window : undefined),
});

export interface UseElementVisibilityOptions {
  /**
   * Initial value.
   * @default false
   */
  initialValue?: boolean;
  /**
   * The element that is used as the viewport for checking visibility of the target.
   */
  scrollTarget?: MaybeComputedElementRef;
  /**
   * Stop tracking when element visibility changes for the first time
   * @default false
   */
  once?: boolean;
  /**
   * A string which specifies a set of offsets to add to the root's bounding box when calculating intersections.
   * @default '0px'
   */
  rootMargin?: string;
  /**
   * Either a single number or an array of numbers between 0.0 and 1.
   * @default 0
   */
  threshold?: number | number[];
}

export interface UseElementVisibilityReturnWithControls {
  /**
   * Whether the element is currently visible in the viewport.
   */
  isVisible: boolean;
  /**
   * Stop observing.
   */
  stop: () => void;
  /**
   * Pause observing.
   */
  pause: () => void;
  /**
   * Resume observing.
   */
  resume: () => void;
  /**
   * Whether IntersectionObserver is supported.
   */
  isSupported: boolean;
  /**
   * Whether the observer is currently active.
   */
  isActive: boolean;
}

export type UseElementVisibilityHandler = (isVisible: boolean) => void;

/**
 * Directive that tracks the visibility of an element within the viewport.
 *
 * @example
 * Basic usage with output:
 * ```html
 * <div #el="ngxUseElementVisibility"
 *      [ngxUseElementVisibilityOptions]="{ threshold: 0.5 }"
 *      (ngxUseElementVisibility)="onVisibilityChange($event)">
 *   Content
 * </div>
 * {{ el.isVisible }}
 * ```
 *
 * @example
 * With controls:
 * ```html
 * <div #el="ngxUseElementVisibility"
 *      [ngxUseElementVisibilityOptions]="{ controls: true }"
 *      (ngxUseElementVisibility)="onVisibilityChange($event)">
 *   Content
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxUseElementVisibility]',
  standalone: true,
})
export class NgxUseElementVisibilityDirective {
  /**
   * Event emitter that fires when visibility changes.
   * Emits a boolean indicating whether the element is visible.
   */
  @Output() ngxUseElementVisibility = new EventEmitter<boolean>();

  /**
   * Options for configuring visibility detection.
   */
  @Input() ngxUseElementVisibilityOptions: UseElementVisibilityOptions & { controls?: boolean } =
    {};

  /**
   * Whether the element is currently visible.
   */
  isVisible = false;

  /**
   * Controls object when using controls mode.
   */
  controls: UseElementVisibilityReturnWithControls | null = null;

  private _observer: IntersectionObserver | null = null;
  private _window: Window | undefined;
  private _onceTriggered = false;
  private _isSupported = true;
  private _isActive = true;

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
    if (!this._window || !('IntersectionObserver' in this._window)) {
      this._isSupported = false;
      return;
    }

    const {
      scrollTarget,
      threshold = 0,
      rootMargin = '0px',
      once = false,
      initialValue = false,
      controls = false,
    } = this.ngxUseElementVisibilityOptions ?? {};

    this.isVisible = initialValue;
    this._onceTriggered = false;

    const callback: IntersectionObserverCallback = (entries) => {
      let isIntersecting = this.isVisible;

      // Get the latest value of isIntersecting based on the entry time
      let latestTime = 0;
      for (const entry of entries) {
        if (entry.time >= latestTime) {
          latestTime = entry.time;
          isIntersecting = entry.isIntersecting;
        }
      }

      const wasVisible = this.isVisible;
      this.isVisible = isIntersecting;

      // Only emit if visibility actually changed
      if (wasVisible !== this.isVisible) {
        this._zone.runOutsideAngular(() => {
          this.ngxUseElementVisibility.emit(this.isVisible);
        });
      }

      // Handle once mode
      if (once && !this._onceTriggered) {
        this._onceTriggered = true;
        // For once mode, we stop after the first change
        // But we still need to wait for the next tick to ensure proper behavior
        this._zone.runOutsideAngular(() => {
          setTimeout(() => {
            this._teardown();
          }, 0);
        });
      }

      // Update controls state
      if (controls) {
        this.controls = {
          isVisible: this.isVisible,
          stop: () => this._teardown(),
          pause: () => {
            this._teardown();
            this._isActive = false;
          },
          resume: () => {
            this._isActive = true;
            this._setupObserver(scrollTarget, threshold, rootMargin);
          },
          isSupported: this._isSupported,
          isActive: this._isActive,
        };
      }
    };

    this._setupObserver(scrollTarget, threshold, rootMargin, callback);
  }

  private _setupObserver(
    scrollTarget?: MaybeComputedElementRef,
    threshold: number | number[] = 0,
    rootMargin = '0px',
    callback?: IntersectionObserverCallback,
  ) {
    if (!this._window || !this._isActive) return;

    const root = unrefElement(scrollTarget) as Element | Document | null;
    const cb = callback ?? this._createCallback();

    this._observer = new (this._window as any).IntersectionObserver(cb, {
      root,
      rootMargin,
      threshold,
    });

    const el = this._elementRef.nativeElement;
    this._observer?.observe(el);
  }

  private _createCallback(): IntersectionObserverCallback {
    return (entries) => {
      let isIntersecting = this.isVisible;

      // Get the latest value of isIntersecting based on the entry time
      let latestTime = 0;
      for (const entry of entries) {
        if (entry.time >= latestTime) {
          latestTime = entry.time;
          isIntersecting = entry.isIntersecting;
        }
      }

      const wasVisible = this.isVisible;
      this.isVisible = isIntersecting;

      // Only emit if visibility actually changed
      if (wasVisible !== this.isVisible) {
        this._zone.runOutsideAngular(() => {
          this.ngxUseElementVisibility.emit(this.isVisible);
        });
      }

      // Handle once mode
      if (this.ngxUseElementVisibilityOptions?.once && !this._onceTriggered) {
        this._onceTriggered = true;
        this._zone.runOutsideAngular(() => {
          setTimeout(() => {
            this._teardown();
          }, 0);
        });
      }

      // Update controls state
      if (this.ngxUseElementVisibilityOptions?.controls) {
        this.controls = {
          isVisible: this.isVisible,
          stop: () => this._teardown(),
          pause: () => {
            this._teardown();
            this._isActive = false;
          },
          resume: () => {
            this._isActive = true;
            const {
              scrollTarget,
              threshold = 0,
              rootMargin = '0px',
            } = this.ngxUseElementVisibilityOptions ?? {};
            this._setupObserver(scrollTarget, threshold, rootMargin);
          },
          isSupported: this._isSupported,
          isActive: this._isActive,
        };
      }
    };
  }

  private _teardown() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }
}
