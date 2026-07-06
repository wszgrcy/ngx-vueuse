import type { Signal } from '@angular/core';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import { toRef } from '@cyia/ngx-vueuse/shared';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { computed, isSignal, signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { defaultWindow } from '../_configurable';
import { useSupported } from '../useSupported';

export type UseSpeechSynthesisStatus = 'init' | 'play' | 'pause' | 'end';

type MaybeRefOrGetter<T> = Signal<T> | T | (() => T);

export interface UseSpeechSynthesisOptions extends ConfigurableWindow {
  /**
   * Language for SpeechSynthesis
   *
   * @default 'en-US'
   */
  lang?: MaybeRefOrGetter<string>;
  /**
   * Gets and sets the pitch at which the utterance will be spoken at.
   *
   * @default 1
   */
  pitch?: MaybeRefOrGetter<SpeechSynthesisUtterance['pitch']>;
  /**
   * Gets and sets the speed at which the utterance will be spoken at.
   *
   * @default 1
   */
  rate?: MaybeRefOrGetter<SpeechSynthesisUtterance['rate']>;
  /**
   * Gets and sets the voice that will be spoken at.
   */
  voice?: Signal<SpeechSynthesisVoice> | SpeechSynthesisVoice;
  /**
   * Gets and sets the volume that the utterance will be spoken at.
   *
   * @default 1
   */
  volume?: MaybeRefOrGetter<SpeechSynthesisUtterance['volume']>;
  /**
   * Callback function that is called when the boundary event is triggered.
   */
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

export interface UseSpeechSynthesisReturn extends Supportable {
  isPlaying: Signal<boolean>;
  status: Signal<UseSpeechSynthesisStatus>;
  utterance: Signal<SpeechSynthesisUtterance>;
  error: Signal<SpeechSynthesisErrorEvent | undefined>;
  stop: () => void;
  toggle: (value?: boolean) => void;
  speak: () => void;
}

/**
 * Unwrap a signal, getter function, or return the raw value.
 */
function toValue<T>(v: MaybeRefOrGetter<T> | Signal<T>): T {
  if (isSignal(v)) return v();
  if (typeof v === 'function') return (v as () => T)();
  return v as T;
}

/**
 * Reactive SpeechSynthesis.
 *
 * @see https://vueuse.org/useSpeechSynthesis
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis SpeechSynthesis
 */
export function useSpeechSynthesis(
  text: MaybeRefOrGetter<string>,
  options: UseSpeechSynthesisOptions = {},
): UseSpeechSynthesisReturn {
  const { pitch = 1, rate = 1, volume = 1, window = defaultWindow, onBoundary } = options;

  const synth = window && ((window as any).speechSynthesis as SpeechSynthesis);
  const isSupported = useSupported(() => synth);

  const isPlaying = signal(false);
  const status = signal<UseSpeechSynthesisStatus>('init');

  const spokenText = toRef(text || '');
  const lang = toRef(options.lang || 'en-US');
  const error = signal<SpeechSynthesisErrorEvent | undefined>(undefined);

  const toggle = (value = !isPlaying()) => {
    isPlaying.set(value);
  };

  const bindEventsForUtterance = (utterance: SpeechSynthesisUtterance) => {
    utterance.lang = toValue(lang) as string;
    utterance.voice =
      toValue(options.voice as MaybeRefOrGetter<SpeechSynthesisVoice> | undefined) || null;
    utterance.pitch = toValue(pitch);
    utterance.rate = toValue(rate);
    utterance.volume = toValue(volume);

    utterance.onstart = () => {
      isPlaying.set(true);
      status.set('play');
    };

    utterance.onpause = () => {
      isPlaying.set(false);
      status.set('pause');
    };

    utterance.onresume = () => {
      isPlaying.set(true);
      status.set('play');
    };

    utterance.onend = () => {
      isPlaying.set(false);
      status.set('end');
    };

    utterance.onerror = (event) => {
      error.set(event);
    };

    utterance.onboundary = (event) => {
      onBoundary?.(event);
    };
  };

  const utterance = computed(() => {
    isPlaying.set(false);
    status.set('init');
    const newUtterance = new SpeechSynthesisUtterance(toValue(spokenText) as string);
    bindEventsForUtterance(newUtterance);
    return newUtterance;
  });

  const speak = () => {
    synth!.cancel();
    if (utterance) synth!.speak(utterance());
  };

  const stop = () => {
    synth!.cancel();
    isPlaying.set(false);
  };

  if (isSupported()) {
    bindEventsForUtterance(utterance());

    // Watch lang: if (utterance.value && !isPlaying.value) utterance.value.lang = lang
    watch(lang, (currentLang) => {
      if (utterance() && !isPlaying()) utterance().lang = currentLang as string;
    });

    // Watch voice: if (options.voice) synth!.cancel()
    if (options.voice) {
      watch(options.voice, () => {
        synth!.cancel();
      });
    }

    // Watch isPlaying: if (isPlaying.value) synth!.resume() else synth!.pause()
    watch(isPlaying, () => {
      if (isPlaying()) synth!.resume();
      else synth!.pause();
    });
  }

  tryOnScopeDispose(() => {
    isPlaying.set(false);
  });

  return {
    isSupported,
    isPlaying,
    status,
    utterance,
    error,

    stop,
    toggle,
    speak,
  };
}
