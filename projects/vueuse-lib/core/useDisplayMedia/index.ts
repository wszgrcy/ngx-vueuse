import type { Signal } from '@angular/core';
import { effect, isSignal, signal } from '@angular/core';
import type { ConfigurableNavigator } from '../_configurable';
import type { Supportable } from '../types';
import { defaultNavigator } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

type MaybeSignal<T> = T | Signal<T>;

function toValue<T>(source: MaybeSignal<T>): T {
  return isSignal(source) ? source() : source;
}

export interface UseDisplayMediaOptions extends ConfigurableNavigator {
  /**
   * If the stream is enabled
   * @default false
   */
  enabled?: MaybeSignal<boolean>;

  /**
   * If the stream video media constraints
   */
  video?: boolean | MediaTrackConstraints | undefined;
  /**
   * If the stream audio media constraints
   */
  audio?: boolean | MediaTrackConstraints | undefined;
}

export interface UseDisplayMediaReturn extends Supportable {
  stream: Signal<MediaStream | undefined>;
  start: () => Promise<MediaStream | undefined>;
  stop: () => void;
  enabled: Signal<boolean>;
}

/**
 * Reactive `mediaDevices.getDisplayMedia` streaming
 *
 * @see https://vueuse.org/useDisplayMedia
 * @param options
 */
export function useDisplayMedia(options: UseDisplayMediaOptions = {}): UseDisplayMediaReturn {
  const enabled = signal<boolean>(toValue(options.enabled ?? false));
  const video = options.video;
  const audio = options.audio;
  const { navigator = defaultNavigator } = options;
  const isSupported = useSupported(() => navigator?.mediaDevices?.getDisplayMedia);

  const constraint: MediaStreamConstraints = { audio, video };

  const stream = signal<MediaStream | undefined>(undefined);

  async function _start() {
    if (!isSupported() || stream()) return;
    stream.set(await navigator!.mediaDevices.getDisplayMedia(constraint));
    stream()
      ?.getTracks()
      .forEach((t) => useEventListener(t, 'ended', stop, { passive: true }));
    return stream();
  }

  async function _stop() {
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

  effect(() => {
    const v = enabled();
    if (v) _start();
    else _stop();
  });

  return {
    isSupported,
    stream,
    start,
    stop,
    enabled,
  };
}
