import { signal, Signal } from '@angular/core';
import type { Supportable } from '../types';
import { useSupported } from '../useSupported';

export interface EyeDropperOpenOptions {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
   */
  signal?: AbortSignal;
}

export interface EyeDropper {
  new (): EyeDropper;
  open: (options?: EyeDropperOpenOptions) => Promise<{ sRGBHex: string }>;
  [Symbol.toStringTag]: 'EyeDropper';
}

export interface UseEyeDropperOptions {
  /**
   * Initial sRGBHex.
   *
   * @default ''
   */
  initialValue?: string;
}

export interface UseEyeDropperReturn extends Supportable {
  sRGBHex: Signal<string>;
  open: (openOptions?: EyeDropperOpenOptions) => Promise<{ sRGBHex: string } | undefined>;
}

/**
 * Reactive [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API)
 *
 * @see https://vueuse.org/useEyeDropper
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useEyeDropper(options: UseEyeDropperOptions = {}): UseEyeDropperReturn {
  const { initialValue = '' } = options;
  const isSupported = useSupported(() => typeof window !== 'undefined' && 'EyeDropper' in window);
  const sRGBHex = signal(initialValue);

  async function open(openOptions?: EyeDropperOpenOptions) {
    if (!isSupported()) return;
    const eyeDropper: EyeDropper = new (
      window as unknown as { EyeDropper: EyeDropper }
    ).EyeDropper();
    const result = await eyeDropper.open(openOptions);
    sRGBHex.set(result.sRGBHex);
    return result;
  }

  return { isSupported, sRGBHex, open };
}
