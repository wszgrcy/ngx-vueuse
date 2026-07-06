import { signal, isSignal, type Signal } from '@angular/core';
import { watch } from '@cyia/ngx-vueuse/patch';
import { defaultWindow } from '../_configurable';
import { useSupported } from '../useSupported';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import type { SpeechRecognition, SpeechRecognitionErrorEvent } from './types';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';

export interface UseSpeechRecognitionOptions extends ConfigurableWindow {
  /**
   * Controls whether continuous results are returned for each recognition, or only a single result.
   *
   * @default true
   */
  continuous?: boolean;
  /**
   * Controls whether interim results should be returned (true) or not (false.) Interim results are results that are not yet final
   *
   * @default true
   */
  interimResults?: boolean;
  /**
   * Language for SpeechRecognition
   *
   * @default 'en-US'
   */
  lang?: Signal<string> | string;
  /**
   * A number representing the maximum returned alternatives for each result.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/maxAlternatives
   * @default 1
   */
  maxAlternatives?: number;
}

export interface UseSpeechRecognitionReturn extends Supportable {
  isListening: Signal<boolean>;
  isFinal: Signal<boolean>;
  recognition: SpeechRecognition | undefined;
  result: Signal<string>;
  /**
   * Confidence value of the latest result, between 0 and 1.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionAlternative/confidence
   */
  confidence: Signal<number>;
  error: Signal<SpeechRecognitionErrorEvent | Error | undefined>;
  toggle: (value?: boolean) => void;
  start: () => void;
  stop: () => void;
}

/**
 * Reactive SpeechRecognition.
 *
 * @see https://vueuse.org/useSpeechRecognition
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition SpeechRecognition
 * @param options
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const {
    interimResults = true,
    continuous = true,
    maxAlternatives = 1,
    window = defaultWindow,
  } = options;

  const toValue = <T>(val: Signal<T> | T): T => (isSignal(val) ? val() : val);

  const langSignal = signal(toValue(options.lang) || 'en-US');
  const isListening = signal(false);
  const isFinal = signal(false);
  const result = signal('');
  const confidence = signal(0);
  const error = signal<SpeechRecognitionErrorEvent | Error | undefined>(undefined);

  let recognition: SpeechRecognition | undefined;

  const start = () => {
    isListening.set(true);
  };

  const stop = () => {
    isListening.set(false);
  };

  const toggle = (value = !isListening()) => {
    if (value) {
      start();
    } else {
      stop();
    }
  };

  const SpeechRecognition =
    window &&
    ((window as unknown as any).SpeechRecognition ||
      (window as unknown as any).webkitSpeechRecognition);
  const isSupported = useSupported(() => SpeechRecognition);

  if (isSupported()) {
    recognition = new SpeechRecognition() as SpeechRecognition;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = toValue(langSignal);
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      isListening.set(true);
      isFinal.set(false);
    };

    // Watch lang changes
    watch(langSignal, (newLang) => {
      if (recognition && !isListening()) recognition.lang = newLang;
    });

    recognition.onresult = (event: unknown) => {
      const currentResult = (event as any).results[(event as any).resultIndex];
      const { transcript, confidence: alternativeConfidence } = currentResult[0];

      isFinal.set(currentResult.isFinal);
      result.set(transcript);
      confidence.set(alternativeConfidence);
      error.set(undefined);
    };

    recognition.onerror = (event: unknown) => {
      error.set(event as SpeechRecognitionErrorEvent);
    };

    recognition.onend = () => {
      isListening.set(false);
      recognition!.lang = toValue(langSignal);
    };

    // Watch isListening changes
    watch(isListening, (newValue) => {
      try {
        if (newValue) {
          recognition!.start();
        } else {
          recognition!.stop();
        }
      } catch (err) {
        error.set(err as unknown as Error);
      }
    });
  }

  tryOnScopeDispose(() => {
    stop();
  });

  return {
    isSupported,
    isListening,
    isFinal,
    recognition,
    result,
    confidence,
    error,

    toggle,
    start,
    stop,
  };
}
