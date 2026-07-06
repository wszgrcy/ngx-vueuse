import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import { createSingletonPromise } from '@cyia/ngx-vueuse/shared';
import { defaultNavigator } from '../_configurable';
import { useSupported } from '../useSupported';
import { signal, type Signal, effect, inject, DestroyRef } from '@angular/core';

type DescriptorNamePolyfill =
  | 'accelerometer'
  | 'accessibility-events'
  | 'ambient-light-sensor'
  | 'background-sync'
  | 'camera'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'gyroscope'
  | 'magnetometer'
  | 'microphone'
  | 'notifications'
  | 'payment-handler'
  | 'persistent-storage'
  | 'push'
  | 'speaker'
  | 'local-fonts';

export type GeneralPermissionDescriptor = PermissionDescriptor | { name: DescriptorNamePolyfill };

export interface UsePermissionOptions<Controls extends boolean> extends ConfigurableNavigator {
  /**
   * Expose more controls
   *
   * @default false
   */
  controls?: Controls;
}

export type UsePermissionReturn = Signal<PermissionState | undefined>;
export interface UsePermissionReturnWithControls extends Supportable {
  state: UsePermissionReturn;
  query: () => Promise<PermissionStatus | undefined>;
}

/**
 * Reactive Permissions API.
 *
 * @see https://vueuse.org/usePermission
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePermission(
  permissionDesc: GeneralPermissionDescriptor | GeneralPermissionDescriptor['name'],
  options?: UsePermissionOptions<false>,
): UsePermissionReturn;
export function usePermission(
  permissionDesc: GeneralPermissionDescriptor | GeneralPermissionDescriptor['name'],
  options: UsePermissionOptions<true>,
): UsePermissionReturnWithControls;

/**
 * Reactive Permissions API.
 *
 * @see https://vueuse.org/usePermission
 *
 * @__NO_SIDE_EFFECTS__
 */
export function usePermission(
  permissionDesc: GeneralPermissionDescriptor | GeneralPermissionDescriptor['name'],
  options: UsePermissionOptions<boolean> = {},
): UsePermissionReturn | UsePermissionReturnWithControls {
  const { controls = false, navigator = defaultNavigator } = options;

  const isSupported = useSupported(() => navigator && 'permissions' in navigator);
  const destroyRef = inject(DestroyRef);
  const permissionStatus = signal<PermissionStatus | undefined>(undefined);

  const desc =
    typeof permissionDesc === 'string'
      ? ({ name: permissionDesc } as PermissionDescriptor)
      : (permissionDesc as PermissionDescriptor);
  const state = signal<PermissionState | undefined>(undefined);

  const update = () => {
    state.update(() => permissionStatus()?.state ?? 'prompt');
  };

  // Use effect to watch permissionStatus and add/remove event listener
  let currentStatus: PermissionStatus | undefined;
  effect(() => {
    const ps = permissionStatus();
    if (ps !== currentStatus) {
      // Remove listener from old status
      if (currentStatus) {
        currentStatus.removeEventListener('change', update);
      }
      // Add listener to new status
      if (ps) {
        ps.addEventListener('change', update, { passive: true });
        currentStatus = ps;
      }
    }

    return () => {
      if (currentStatus) {
        currentStatus.removeEventListener('change', update);
        currentStatus = undefined;
      }
    };
  });

  const query = createSingletonPromise(async () => {
    if (!isSupported()) return undefined;

    if (!permissionStatus()) {
      try {
        permissionStatus.set(await navigator!.permissions.query(desc));
      } catch {
        permissionStatus.set(undefined);
      } finally {
        update();
      }
    }

    if (controls) return permissionStatus();
    return undefined;
  });

  query();

  if (controls) {
    return {
      state,
      isSupported,
      query,
    };
  } else {
    return state;
  }
}
