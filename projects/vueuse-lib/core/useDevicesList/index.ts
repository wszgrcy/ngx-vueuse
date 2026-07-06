/**
 * This implementation is originally ported from https://github.com/logaretm/vue-use-web by Abdelrahman Awad
 */

import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import { computed, signal, type Signal } from '@angular/core';
import { defaultNavigator } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { usePermission } from '../usePermission';
import { useSupported } from '../useSupported';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';

export interface UseDevicesListOptions extends ConfigurableNavigator {
  onUpdated?: (devices: MediaDeviceInfo[]) => void;
  /**
   * Request for permissions immediately if it's not granted,
   * otherwise label and deviceIds could be empty
   *
   * @default false
   */
  requestPermissions?: boolean;
  /**
   * Request for types of media permissions
   *
   * @default { audio: true, video: true }
   */
  constraints?: MediaStreamConstraints;
}

export interface UseDevicesListReturn extends Supportable {
  /**
   * All devices
   */
  devices: Signal<MediaDeviceInfo[]>;
  videoInputs: Signal<MediaDeviceInfo[]>;
  audioInputs: Signal<MediaDeviceInfo[]>;
  audioOutputs: Signal<MediaDeviceInfo[]>;
  permissionGranted: Signal<boolean>;
  ensurePermissions: () => Promise<boolean>;
}

/**
 * Reactive `enumerateDevices` listing available input/output devices
 *
 * @see https://vueuse.org/useDevicesList
 * @param options
 */
export function useDevicesList(options: UseDevicesListOptions = {}): UseDevicesListReturn {
  const {
    navigator = defaultNavigator,
    requestPermissions = false,
    constraints = { audio: true, video: true },
    onUpdated,
  } = options;

  const devices = signal<MediaDeviceInfo[]>([]);
  const videoInputs = computed(() => devices().filter((i) => i.kind === 'videoinput'));
  const audioInputs = computed(() => devices().filter((i) => i.kind === 'audioinput'));
  const audioOutputs = computed(() => devices().filter((i) => i.kind === 'audiooutput'));
  const isSupported = useSupported(
    () => navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices,
  );
  const permissionGranted = signal(false);
  let stream: MediaStream | null;

  async function update() {
    if (!isSupported()) return;

    devices.set(await navigator!.mediaDevices.enumerateDevices());
    onUpdated?.(devices());
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  async function ensurePermissions() {
    const deviceName = constraints.video ? 'camera' : 'microphone';

    if (!isSupported()) return false;

    if (permissionGranted()) return true;

    const { state, query } = usePermission(deviceName, { controls: true });
    await query();
    if (state() !== 'granted') {
      let granted = true;
      try {
        const allDevices = await navigator!.mediaDevices.enumerateDevices();
        const hasCamera = allDevices.some((device) => device.kind === 'videoinput');
        const hasMicrophone = allDevices.some(
          (device) => device.kind === 'audioinput' || device.kind === 'audiooutput',
        );
        constraints.video = hasCamera ? constraints.video : false;
        constraints.audio = hasMicrophone ? constraints.audio : false;
        stream = await navigator!.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = null;
        granted = false;
      }
      update();
      permissionGranted.set(granted);
    } else {
      permissionGranted.set(true);
    }

    return permissionGranted();
  }

  tryOnScopeDispose(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  });

  if (isSupported()) {
    if (requestPermissions) ensurePermissions();

    useEventListener(navigator!.mediaDevices, 'devicechange', update, { passive: true });
    update();
  }

  return {
    devices,
    ensurePermissions,
    permissionGranted,
    videoInputs,
    audioInputs,
    audioOutputs,
    isSupported,
  };
}
