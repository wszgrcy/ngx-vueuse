import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';

import { defaultWindow } from '../_configurable';
import {
  useActiveElement,
  type UseActiveElementOptions,
  type UseActiveElementReturn,
} from './index';

export interface UseActiveElementEmits {
  trigger: (element: HTMLElement | null | undefined) => void;
}

/**
 * Directive that tracks the currently active element.
 *
 * @example
 * ```html
 * <div ngxUseActiveElement (trigger)="onActiveChange($event)">
 *   Content
 * </div>
 * ```
 */
@Component({
  selector: '[ngxUseActiveElement],ngx-use-active-element',
  standalone: true,
  exportAs: 'ngxUseActiveElement',
  template: `<ng-content></ng-content>`,
})
export class NgxUseActiveElementComponent {
  @Input() ngxUseActiveElementOptions: UseActiveElementOptions = {};
  @Output() readonly trigger = new EventEmitter<HTMLElement | null | undefined>();

  private _activeElement: UseActiveElementReturn<HTMLElement>;
  private _window: (Window & typeof globalThis) | undefined =
    inject(defaultWindow as any, { optional: true }) ?? defaultWindow ?? undefined;

  constructor() {
    this._activeElement = useActiveElement({
      ...this.ngxUseActiveElementOptions,
    });

    // Emit the active element when it changes
    watch(this._activeElement, (element) => {
      this.trigger.emit(element);
    });
  }
}
