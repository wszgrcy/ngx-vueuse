import { Component, Output, EventEmitter, inject, input } from '@angular/core';

import { defaultWindow } from '../_configurable';
import {
  useBrowserLocation,
  type UseBrowserLocationOptions,
  type BrowserLocationState,
} from './useBrowserLocation';

export interface UseBrowserLocationEmits {
  trigger: (data: BrowserLocationState) => void;
}

/**
 * Directive that provides reactive browser location.
 *
 * @example
 * ```html
 * <div ngxUseBrowserLocation (trigger)="onLocationChange($event)">
 *   Current URL: {{ $event.href() }}
 * </div>
 * ```
 */
@Component({
  selector: '[ngxUseBrowserLocation],ngx-use-browser-location',
  standalone: true,
  exportAs: 'ngxUseBrowserLocation',
  template: `<ng-content></ng-content>`,
})
export class NgxUseBrowserLocationComponent {
  ngxUseBrowserLocationOptions = input<UseBrowserLocationOptions>({});
  @Output() readonly trigger = new EventEmitter<BrowserLocationState>();

  private _window: (Window & typeof globalThis) | undefined =
    inject(defaultWindow as any, { optional: true }) ?? defaultWindow ?? undefined;
  private _locationData;

  constructor() {
    this._locationData = useBrowserLocation({
      ...this.ngxUseBrowserLocationOptions(),
      window: this._window,
    });

    this.trigger.emit(this._locationData());
  }
}
