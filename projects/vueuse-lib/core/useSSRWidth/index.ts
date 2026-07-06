import { inject, InjectionToken } from '@angular/core';

const ssrWidthSymbol = Symbol('ngx-vueuse-ssr-width') as unknown as InjectionToken<number | null>;

/**
 * Get the SSR width value.
 * Returns undefined if not provided.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useSSRWidth(): number | undefined {
  // First try injection context
  try {
    const ssrWidth = inject(ssrWidthSymbol, { optional: true });
    if (typeof ssrWidth === 'number') {
      return ssrWidth;
    }
  } catch {
    // Not in injection context, continue to global store check
  }

  // Fallback to global store (for testing compatibility)
  const globalWidth = (globalThis as any).__NGX_VUEUSE_SSR_WIDTH__;
  return typeof globalWidth === 'number' ? globalWidth : undefined;
}

/**
 * Provide SSR width for testing or runtime configuration.
 * In Angular, this uses a global store approach for compatibility.
 *
 * @param width - The SSR width value to provide
 *
 * @note For production use, prefer using Angular's provide() in app config:
 * @example
 * // In app.config.ts
 * import { provideSSRWidth } from '@vueuse/core'
 * export const appConfig = applicationConfig({
 *   providers: [provide(SSR_WIDTH_TOKEN, 768)]
 * })
 */
export function provideSSRWidth(width: number | null) {
  // For Angular compatibility, we store the value in a global store
  // This allows useSSRWidth to retrieve it without injection context
  (globalThis as any).__NGX_VUEUSE_SSR_WIDTH__ = width;
}
