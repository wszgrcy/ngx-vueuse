import type { UseAsyncStateOptions, UseAsyncStateReturn } from '../useAsyncState';
import { useAsyncState } from '../useAsyncState';
import { effect, isSignal } from '@angular/core';
import { toValue, type MaybeRefOrGetter } from '@cyia/ngx-vueuse/shared';

export interface UseImageOptions {
  /** Address of the resource */
  src: string;
  /** Images to use in different situations, e.g., high-resolution displays, small monitors, etc. */
  srcset?: string;
  /** Image sizes for different page layouts */
  sizes?: string;
  /** Image alternative information */
  alt?: string;
  /** Image classes */
  class?: string;
  /** Image loading */
  loading?: HTMLImageElement['loading'];
  /** Image CORS settings */
  crossorigin?: string;
  /** Referrer policy for fetch https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy */
  referrerPolicy?: HTMLImageElement['referrerPolicy'];
  /** Image width */
  width?: HTMLImageElement['width'];
  /** Image height */
  height?: HTMLImageElement['height'];
  /** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#decoding */
  decoding?: HTMLImageElement['decoding'];
  /** Provides a hint of the relative priority to use when fetching the image */
  fetchPriority?: HTMLImageElement['fetchPriority'];
  /** Provides a hint of the importance of the image */
  ismap?: HTMLImageElement['isMap'];
  /** The partial URL (starting with #) of an image map associated with the element */
  usemap?: HTMLImageElement['useMap'];
}

export type UseImageReturn = UseAsyncStateReturn<HTMLImageElement | undefined, any[], true>;

async function loadImage(options: UseImageOptions): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.src = options.src;

    if (options.srcset != null) img.srcset = options.srcset;
    if (options.sizes != null) img.sizes = options.sizes;
    if (options.class != null) img.className = options.class;
    if (options.loading != null) img.loading = options.loading;
    if (options.crossorigin != null) img.crossOrigin = options.crossorigin;
    if (options.referrerPolicy != null) img.referrerPolicy = options.referrerPolicy;
    if (options.width != null) img.width = options.width;
    if (options.height != null) img.height = options.height;
    if (options.decoding != null) img.decoding = options.decoding;
    if (options.fetchPriority != null) img.fetchPriority = options.fetchPriority;
    if (options.ismap != null) img.isMap = options.ismap;
    if (options.usemap != null) img.useMap = options.usemap;

    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

/**
 * Reactive load an image in the browser, you can wait the result to display it or show a fallback.
 *
 * @see https://vueuse.org/useImage
 * @param options Image attributes, as used in the <img> tag
 * @param asyncStateOptions
 */
export function useImage(
  options: MaybeRefOrGetter<UseImageOptions>,
  asyncStateOptions: UseAsyncStateOptions<any> = {},
): UseImageReturn {
  const state = useAsyncState<HTMLImageElement | undefined>(
    () => loadImage(toValue(options)),
    undefined,
    {
      resetOnExecute: true,
      ...asyncStateOptions,
    },
  );

  // Watch for options changes (equivalent to Vue's watch with deep: true)
  try {
    effect(() => {
      // Read options to track dependency
      if (isSignal(options)) {
        options();
      } else {
        toValue(options);
      }
      // Re-execute with new options
      state.execute(asyncStateOptions.delay);
    });
  } catch {
    // Not in injection context - skip watching
  }

  return state;
}
