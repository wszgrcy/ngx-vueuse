export * from './_configurable';


import type { Signal } from '@angular/core';

export interface Position {
  x: number;
  y: number;
}

export interface RenderableComponent {
  /**
   * The element that the component should be rendered as
   *
   * @default 'div'
   */
  as?: object | string;
}

export type PointerType = 'mouse' | 'touch' | 'pen';

export interface Supportable {
  isSupported: Signal<boolean>;
}
