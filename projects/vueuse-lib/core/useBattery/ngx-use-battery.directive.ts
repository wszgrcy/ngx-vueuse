import { Component, Input, Output, EventEmitter } from '@angular/core';

import { defaultNavigator } from '../_configurable';
import { useBattery, type UseBatteryOptions, type UseBatteryReturn } from './useBattery';

export interface UseBatteryEmits {
  trigger: (data: UseBatteryReturn) => void;
}

/**
 * Directive that provides reactive Battery Status API.
 *
 * @example
 * ```html
 * <div ngxUseBattery (trigger)="onBatteryChange($event)">
 *   Charging: {{ $event.charging() }}
 *   Level: {{ $event.level() }}
 * </div>
 * ```
 */
@Component({
  selector: '[ngxUseBattery],ngx-use-battery',
  standalone: true,
  exportAs: 'ngxUseBattery',
  template: `<ng-content></ng-content>`,
})
export class NgxUseBatteryComponent {
  @Input() ngxUseBatteryOptions: UseBatteryOptions = {};
  @Output() readonly trigger = new EventEmitter<UseBatteryReturn>();

  private _navigator = defaultNavigator;
  private _batteryData: UseBatteryReturn;

  constructor() {
    this._batteryData = useBattery({
      ...this.ngxUseBatteryOptions,
      navigator: this._navigator,
    });

    this.trigger.emit(this._batteryData);
  }
}
