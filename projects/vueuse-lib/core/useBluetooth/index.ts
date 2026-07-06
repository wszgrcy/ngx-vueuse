import type { Signal } from '@angular/core';
import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import { afterNextRender, DestroyRef, effect, inject, signal } from '@angular/core';
import { defaultNavigator } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';
import { toValue } from '@cyia/ngx-vueuse/shared';

// DOM Bluetooth API types (may not be available in all TS configs)
type BluetoothServiceUUID = string | number;

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[] | undefined;
  name?: string | undefined;
  namePrefix?: string | undefined;
}

interface BluetoothNavigator {
  requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
}

interface BluetoothRequestDeviceOptions {
  acceptAllDevices?: boolean;
  filters?: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[];
}

interface BluetoothDevice {
  gatt?: BluetoothRemoteGATTServer;
  disconnect(): void;
  addEventListener(event: 'gattserverdisconnected', listener: () => void, options?: any): void;
  removeEventListener(event: 'gattserverdisconnected', listener: () => void, options?: any): void;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
}

declare global {
  interface Navigator {
    bluetooth?: BluetoothNavigator | undefined;
  }
}

export interface UseBluetoothRequestDeviceOptions {
  /**
   *
   * An array of BluetoothScanFilters. This filter consists of an array
   * of BluetoothServiceUUIDs, a name parameter, and a namePrefix parameter.
   *
   */
  filters?: BluetoothLEScanFilter[] | undefined;
  /**
   *
   * An array of BluetoothServiceUUIDs.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/BluetoothRemoteGATTService/uuid
   *
   */
  optionalServices?: BluetoothServiceUUID[] | undefined;
}

export interface UseBluetoothOptions
  extends UseBluetoothRequestDeviceOptions, ConfigurableNavigator {
  /**
   *
   * A boolean value indicating that the requesting script can accept all Bluetooth
   * devices. The default is false.
   *
   * !! This may result in a bunch of unrelated devices being shown
   * in the chooser and energy being wasted as there are no filters.
   *
   *
   * Use it with caution.
   *
   * @default false
   *
   */
  acceptAllDevices?: boolean;
}

export interface UseBluetoothReturn extends Supportable {
  isSupported: Signal<boolean>;
  isConnected: Signal<boolean>;
  // Device:
  device: Signal<BluetoothDevice | undefined>;
  requestDevice: () => Promise<void>;
  // Server:
  server: Signal<BluetoothRemoteGATTServer | undefined>;
  // Errors:
  error: Signal<unknown | null>;
}

/* @__NO_SIDE_EFFECTS__ */
export function useBluetooth(options?: UseBluetoothOptions): UseBluetoothReturn {
  let { acceptAllDevices = false } = options || {};

  const {
    filters = undefined,
    optionalServices = undefined,
    navigator = defaultNavigator,
  } = options || {};

  const isSupported = useSupported(() => navigator && 'bluetooth' in navigator);

  const device = signal<BluetoothDevice | undefined>(undefined);

  const error = signal<unknown | null>(null);

  // Watch device changes and connect to GATT server
  effect(() => {
    const _device = toValue(device);
    if (_device !== undefined) {
      connectToBluetoothGATTServer();
    }
  });

  async function requestDevice(): Promise<void> {
    // This is the function can only be called if Bluetooth API is supported:
    if (!isSupported()) return;

    // Reset any errors we currently have:
    error.set(null);

    // If filters specified, we need to ensure we  don't accept all devices:
    if (filters && filters.length > 0) acceptAllDevices = false;

    try {
      const bt = navigator?.bluetooth;
      device.set(
        (await bt!.requestDevice({
          acceptAllDevices,
          filters,
          optionalServices,
        })) as BluetoothDevice | undefined,
      );
    } catch (err) {
      error.set(err);
    }
  }

  const server = signal<BluetoothRemoteGATTServer | undefined>(undefined);
  const isConnected = signal(false);

  function reset() {
    isConnected.set(false);
    device.set(undefined);
    server.set(undefined);
  }

  async function connectToBluetoothGATTServer() {
    // Reset any errors we currently have:
    error.set(null);

    const currentDevice = device();
    if (currentDevice && currentDevice.gatt) {
      // Add reset fn to gattserverdisconnected event:
      useEventListener(currentDevice, 'gattserverdisconnected', reset, { passive: true });

      try {
        // Connect to the device:
        const connectedServer = await currentDevice.gatt.connect();
        server.set(connectedServer);
        isConnected.set(connectedServer.connected);
      } catch (err) {
        error.set(err);
      }
    }
  }

  const _destroyRef = inject(DestroyRef);

  // onMounted equivalent: if device already set on init, connect
  afterNextRender(() => {
    const currentDevice = device();
    if (currentDevice) currentDevice.gatt?.connect();
  });

  // tryOnScopeDispose equivalent: disconnect on destroy
  _destroyRef.onDestroy(() => {
    const currentDevice = device();
    if (currentDevice) currentDevice.gatt?.disconnect();
  });

  return {
    isSupported,
    isConnected,
    // Device:
    device,
    requestDevice,
    // Server:
    server,
    // Errors:
    error,
  };
}
