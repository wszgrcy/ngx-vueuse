/**
 * Reactive `mediaDevices.getUserMedia` streaming for Angular.
 *
 * Ported from VueUse's useUserMedia to Angular signals.
 * Original implementation by Abdelrahman Awad.
 *
 * @see https://vueuse.org/useUserMedia
 */

import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import { defaultNavigator } from '../_configurable';
import { useSupported } from '../useSupported';
import { signal, isSignal, inject, DestroyRef, type Signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';

type MaybeSignal<T> = T | Signal<T>;

function toValue<T>(source: MaybeSignal<T>): T {
  return isSignal(source) ? source() : source;
}

export interface UseUserMediaOptions extends ConfigurableNavigator {
  /**
   * If the stream is enabled
   * @default false
   */
  enabled?: MaybeSignal<boolean>;
  /**
   * Recreate stream when deviceIds or constraints changed
   *
   * @default true
   */
  autoSwitch?: MaybeSignal<boolean>;
  /**
   * MediaStreamConstraints to be applied to the requested MediaStream
   * If provided, the constraints will override videoDeviceId and audioDeviceId
   *
   * @default {}
   */
  constraints?: MaybeSignal<MediaStreamConstraints>;
}

export interface UseUserMediaReturn extends Supportable {
  stream: Signal<MediaStream | undefined>;
  start: () => Promise<MediaStream | undefined>;
  stop: () => void;
  restart: () => Promise<MediaStream | undefined>;
  constraints: Signal<MediaStreamConstraints | undefined>;
  enabled: Signal<boolean>;
  autoSwitch: Signal<boolean>;
}

/**
 * Reactive `mediaDevices.getUserMedia` streaming
 *
 * @see https://vueuse.org/useUserMedia
 * @param options
 */
export function useUserMedia(options: UseUserMediaOptions = {}): UseUserMediaReturn {
  const enabled = signal<boolean>(toValue(options.enabled ?? false));
  const autoSwitch = signal<boolean>(toValue(options.autoSwitch ?? true));
  const constraints = signal<MediaStreamConstraints | undefined>(toValue(options.constraints));
  const { navigator: customNavigator = defaultNavigator } = options;
  const isSupported = useSupported(() => customNavigator?.mediaDevices?.getUserMedia);
  const destroyRef = inject(DestroyRef);

  const stream = signal<MediaStream | undefined>(undefined);

  function getDeviceOptions(type: 'video' | 'audio') {
    const currentConstraints: any = toValue(constraints);
    switch (type) {
      case 'video': {
        if (currentConstraints) return currentConstraints.video || false;
        break;
      }
      case 'audio': {
        if (currentConstraints) return currentConstraints.audio || false;
        break;
      }
    }
  }

  async function _start() {
    if (!isSupported() || stream()) return;
    stream.set(
      await customNavigator!.mediaDevices.getUserMedia({
        video: getDeviceOptions('video'),
        audio: getDeviceOptions('audio'),
      }),
    );
  }

  function _stop() {
    stream()
      ?.getTracks()
      .forEach((t) => t.stop());
    stream.set(undefined);
  }

  function stop() {
    _stop();
    enabled.set(false);
  }

  async function start() {
    await _start();
    if (stream()) enabled.set(true);
    return stream();
  }

  async function restart() {
    _stop();
    return await start();
  }

  // Watch enabled changes
  watch(
    enabled,
    (v) => {
      if (v) _start();
      else _stop();
    },
    { immediate: true },
  );

  // Watch constraints changes with deep equality
  watch(
    constraints,
    () => {
      if (autoSwitch() && stream()) restart();
    },
    { immediate: true },
  );

  // Cleanup on scope dispose
  destroyRef.onDestroy(() => {
    stop();
  });

  return {
    isSupported,
    stream,
    start,
    stop,
    restart,
    constraints,
    enabled,
    autoSwitch,
  };
}
