import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';
import type { EffectRef } from '@angular/core';
import { useElementBounding, type UseElementBoundingOptions } from './index';
import { syncEffect } from '@cyia/ngx-vueuse/patch';

type ElementBounding = {
  height: number;
  bottom: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
};
type BindingValueFunction = (bounding: ElementBounding) => void;
type BindingValueArray = [BindingValueFunction, UseElementBoundingOptions];

@Directive({
  selector: '[ngxElementBounding]',
  standalone: true,
})
export class NgxElementBoundingDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * Handler function or event emitter for bounding box changes.
   * Can be a function reference that receives ElementBounding,
   * or an array of [handler, options].
   */
  @Input() ngxElementBounding: BindingValueFunction | BindingValueArray = ((
    bounding: ElementBounding,
  ) => {}) as BindingValueFunction;

  private stopEffect: EffectRef | null = null;

  ngOnInit(): void {
    this.setupBounding();
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private setupBounding(): void {
    const el = this.elementRef.nativeElement;
    const input = this.ngxElementBounding;

    const [handler, options] = (
      typeof input === 'function' ? [input, {}] : input
    ) as BindingValueArray;

    const result = useElementBounding(el, options);

    this.stopEffect = syncEffect(() => {
      handler({
        height: result.height(),
        bottom: result.bottom(),
        left: result.left(),
        right: result.right(),
        top: result.top(),
        width: result.width(),
        x: result.x(),
        y: result.y(),
      });
    });
  }

  private teardown(): void {
    this.stopEffect?.destroy();
    this.stopEffect = null;
  }
}
