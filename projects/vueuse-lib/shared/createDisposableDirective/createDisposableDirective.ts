import type { OnDestroy, OnInit } from '@angular/core';
import { DestroyRef, inject } from '@angular/core';

type EffectFactory = () => void;

interface DisposableDirectiveHooks {
  onMount?: (element: HTMLElement) => void;
  onUnmount?: (element: HTMLElement) => void;
  onEffect?: (element: HTMLElement, cleanup: () => void) => void;
}

/**
 * Utility for authoring disposable directives. Effects created within mount hook will be automatically disposed when directive is destroyed.
 *
 * @see https://vueuse.org/createDisposableDirective
 *
 * @__NO_SIDE_EFFECTS__
 */
export function createDisposableDirective<H extends HTMLElement = HTMLElement>(
  hooks: DisposableDirectiveHooks,
): OnInit & OnDestroy {
  const { onMount, onUnmount, onEffect } = hooks;

  return {
    ngOnInit() {
      const element =
        (this as any).elementRef?.nativeElement ?? (this as any)._elementRef?.nativeElement;
      if (!element) return;

      // Call onMount if provided
      if (onMount) {
        onMount(element);
      }

      // Call onEffect if provided, and register cleanup with DestroyRef
      if (onEffect) {
        const destroyRef = inject(DestroyRef);
        onEffect(element, () => {
          // This cleanup will be called when the directive is destroyed
        });
      }
    },
    ngOnDestroy() {
      const element =
        (this as any).elementRef?.nativeElement ?? (this as any)._elementRef?.nativeElement;
      if (!element) return;

      // Call onUnmount if provided
      if (onUnmount) {
        onUnmount(element);
      }
    },
  } as OnInit & OnDestroy;
}
