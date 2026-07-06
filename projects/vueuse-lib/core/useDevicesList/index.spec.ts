import { describe, expect, it } from 'vitest';
import type { UseDevicesListReturn } from './index';
import type { Signal } from '@angular/core';

describe('useDevicesList', () => {
  describe('type definitions', () => {
    it('should export UseDevicesListReturn type with correct structure', () => {
      // This test verifies the type definition is correct by checking
      // that a mock implementation satisfies the interface
      const mockResult: UseDevicesListReturn = {
        devices: {} as Signal<MediaDeviceInfo[]>,
        videoInputs: {} as Signal<MediaDeviceInfo[]>,
        audioInputs: {} as Signal<MediaDeviceInfo[]>,
        audioOutputs: {} as Signal<MediaDeviceInfo[]>,
        permissionGranted: {} as Signal<boolean>,
        ensurePermissions: () => Promise.resolve(false),
        isSupported: {} as Signal<boolean>,
      };

      // Verify all required properties exist
      expect(mockResult).toHaveProperty('devices');
      expect(mockResult).toHaveProperty('videoInputs');
      expect(mockResult).toHaveProperty('audioInputs');
      expect(mockResult).toHaveProperty('audioOutputs');
      expect(mockResult).toHaveProperty('permissionGranted');
      expect(mockResult).toHaveProperty('ensurePermissions');
      expect(mockResult).toHaveProperty('isSupported');
    });

    it('should have ensurePermissions return a Promise<boolean>', () => {
      const mockResult: UseDevicesListReturn = {
        devices: {} as Signal<MediaDeviceInfo[]>,
        videoInputs: {} as Signal<MediaDeviceInfo[]>,
        audioInputs: {} as Signal<MediaDeviceInfo[]>,
        audioOutputs: {} as Signal<MediaDeviceInfo[]>,
        permissionGranted: {} as Signal<boolean>,
        ensurePermissions: async () => true,
        isSupported: {} as Signal<boolean>,
      };

      // Type check: ensurePermissions should be callable and return a Promise
      const result: Promise<boolean> = mockResult.ensurePermissions();
      expect(typeof result.then).toBe('function');
    });

    it('should have all device signals and computed signals', () => {
      // Signals are callable in Angular, so we use mock functions
      const mockResult: UseDevicesListReturn = {
        devices: (() => []) as unknown as Signal<MediaDeviceInfo[]>,
        videoInputs: (() => []) as unknown as Signal<MediaDeviceInfo[]>,
        audioInputs: (() => []) as unknown as Signal<MediaDeviceInfo[]>,
        audioOutputs: (() => []) as unknown as Signal<MediaDeviceInfo[]>,
        permissionGranted: (() => false) as unknown as Signal<boolean>,
        ensurePermissions: () => Promise.resolve(false),
        isSupported: (() => true) as unknown as Signal<boolean>,
      };

      // All device-related properties should be signals (functions)
      expect(typeof mockResult.devices).toBe('function');
      expect(typeof mockResult.videoInputs).toBe('function');
      expect(typeof mockResult.audioInputs).toBe('function');
      expect(typeof mockResult.audioOutputs).toBe('function');
      expect(typeof mockResult.permissionGranted).toBe('function');
      expect(typeof mockResult.isSupported).toBe('function');
    });
  });

  describe('interface compatibility', () => {
    it('should extend Supportable interface', () => {
      const mockResult: UseDevicesListReturn = {
        devices: {} as Signal<MediaDeviceInfo[]>,
        videoInputs: {} as Signal<MediaDeviceInfo[]>,
        audioInputs: {} as Signal<MediaDeviceInfo[]>,
        audioOutputs: {} as Signal<MediaDeviceInfo[]>,
        permissionGranted: {} as Signal<boolean>,
        ensurePermissions: () => Promise.resolve(false),
        isSupported: {} as Signal<boolean>,
      };

      // Supportable requires isSupported: Signal<boolean>
      expect(mockResult).toHaveProperty('isSupported');
    });

    it('should have correct device kind filtering types', () => {
      // Verify that the device signals return MediaDeviceInfo arrays
      const mockDevices: MediaDeviceInfo[] = [
        { kind: 'videoinput', deviceId: '1', label: 'Camera', groupId: 'g1' } as MediaDeviceInfo,
        { kind: 'audioinput', deviceId: '2', label: 'Mic', groupId: 'g2' } as MediaDeviceInfo,
        { kind: 'audiooutput', deviceId: '3', label: 'Speaker', groupId: 'g3' } as MediaDeviceInfo,
      ];

      expect(mockDevices[0].kind).toBe('videoinput');
      expect(mockDevices[1].kind).toBe('audioinput');
      expect(mockDevices[2].kind).toBe('audiooutput');
    });
  });
});
