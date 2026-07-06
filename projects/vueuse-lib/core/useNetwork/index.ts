/**
 * Reactive Network status for Angular
 *
 * Ported from VueUse useNetwork
 * @see https://vueuse.org/useNetwork
 */

import type { Signal, WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import { defaultWindow } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

type ReadonlySignal<T> = { readonly: true } & Signal<T>;

function shallowReadonlySignal<T>(sig: WritableSignal<T>): ReadonlySignal<T> {
  return Object.assign(sig, { readonly: true as const });
}

export interface UseNetworkOptions extends ConfigurableWindow {}

export type NetworkType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown';

export type NetworkEffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | undefined;

export interface NetworkState extends Supportable {
  /**
   * If the user is currently connected.
   */
  isOnline: Signal<boolean>;
  /**
   * The time since the user was last connected.
   */
  offlineAt: Signal<number | undefined>;
  /**
   * At this time, if the user is offline and reconnects
   */
  onlineAt: Signal<number | undefined>;
  /**
   * The download speed in Mbps.
   */
  downlink: Signal<number | undefined>;
  /**
   * The max reachable download speed in Mbps.
   */
  downlinkMax: Signal<number | undefined>;
  /**
   * The detected effective speed type.
   */
  effectiveType: Signal<NetworkEffectiveType | undefined>;
  /**
   * The estimated effective round-trip time of the current connection.
   */
  rtt: Signal<number | undefined>;
  /**
   * If the user activated data saver mode.
   */
  saveData: Signal<boolean | undefined>;
  /**
   * The detected connection/network type.
   */
  type: Signal<NetworkType>;
}

export type UseNetworkReturn = Readonly<NetworkState>;

/**
 * Reactive Network status.
 *
 * @see https://vueuse.org/useNetwork
 * @param options
 */
export function useNetwork(options: UseNetworkOptions = {}): UseNetworkReturn {
  const { window = defaultWindow } = options;
  const navigator = window?.navigator;
  const isSupported = useSupported(() => navigator && 'connection' in navigator);

  const isOnline = signal(true);
  const saveData = signal(false);
  const offlineAt = signal<number | undefined>(undefined);
  const onlineAt = signal<number | undefined>(undefined);
  const downlink = signal<number | undefined>(undefined);
  const downlinkMax = signal<number | undefined>(undefined);
  const rtt = signal<number | undefined>(undefined);
  const effectiveType = signal<NetworkEffectiveType>(undefined);
  const type = signal<NetworkType>('unknown');

  const connection = isSupported() ? (navigator as any)?.connection : undefined;

  function updateNetworkInformation() {
    if (!navigator) return;

    isOnline.set(navigator.onLine);
    offlineAt.set(isOnline() ? undefined : Date.now());
    onlineAt.set(isOnline() ? Date.now() : undefined);

    if (connection) {
      downlink.set(connection.downlink);
      downlinkMax.set(connection.downlinkMax);
      effectiveType.set(connection.effectiveType);
      rtt.set(connection.rtt);
      saveData.set(connection.saveData);
      type.set(connection.type);
    }
  }

  const listenerOptions = { passive: true };

  if (window) {
    useEventListener(
      window,
      'offline',
      () => {
        isOnline.set(false);
        offlineAt.set(Date.now());
      },
      listenerOptions,
    );

    useEventListener(
      window,
      'online',
      () => {
        isOnline.set(true);
        onlineAt.set(Date.now());
      },
      listenerOptions,
    );
  }

  if (connection)
    useEventListener(connection as any, 'change', updateNetworkInformation, listenerOptions);

  updateNetworkInformation();

  return {
    isSupported,
    isOnline: shallowReadonlySignal(isOnline),
    saveData: shallowReadonlySignal(saveData),
    offlineAt: shallowReadonlySignal(offlineAt),
    onlineAt: shallowReadonlySignal(onlineAt),
    downlink: shallowReadonlySignal(downlink),
    downlinkMax: shallowReadonlySignal(downlinkMax),
    effectiveType: shallowReadonlySignal(effectiveType),
    rtt: shallowReadonlySignal(rtt),
    type: shallowReadonlySignal(type),
  };
}
