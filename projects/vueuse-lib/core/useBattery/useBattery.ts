import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import type { Signal } from '@angular/core';
import { signal, DestroyRef, inject } from '@angular/core';
import { defaultNavigator } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

export interface UseBatteryOptions extends ConfigurableNavigator {}

export interface UseBatteryReturn extends Supportable {
  charging: Signal<boolean>;
  chargingTime: Signal<number>;
  dischargingTime: Signal<number>;
  level: Signal<number>;
}

export interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

type NavigatorWithBattery = Navigator & {
  getBattery: () => Promise<BatteryManager>;
};

/**
 * Reactive Battery Status API.
 *
 * @see https://vueuse.org/useBattery
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useBattery(options: UseBatteryOptions = {}): UseBatteryReturn {
  const { navigator = defaultNavigator } = options;
  const events = ['chargingchange', 'chargingtimechange', 'dischargingtimechange', 'levelchange'];

  const isSupported = useSupported(
    () => navigator && 'getBattery' in navigator && typeof navigator.getBattery === 'function',
  );

  const charging = signal(false);
  const chargingTime = signal(0);
  const dischargingTime = signal(0);
  const level = signal(1);

  let battery: BatteryManager | null;

  function updateBatteryInfo(this: BatteryManager) {
    charging.set(this.charging);
    chargingTime.set(this.chargingTime || 0);
    dischargingTime.set(this.dischargingTime || 0);
    level.set(this.level);
  }

  if (isSupported()) {
    (navigator as NavigatorWithBattery).getBattery().then((_battery) => {
      battery = _battery;
      updateBatteryInfo.call(battery);
      useEventListener(battery, events, updateBatteryInfo, { passive: true });
    });
  }

  const destroyRef = inject(DestroyRef);
  destroyRef.onDestroy(() => {
    battery = null;
  });

  return {
    isSupported,
    charging,
    chargingTime,
    dischargingTime,
    level,
  };
}
