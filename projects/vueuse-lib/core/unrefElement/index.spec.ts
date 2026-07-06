import { describe, expect, it } from 'vitest';
import { ElementRef, signal } from '@angular/core';
import { unrefElement } from './index';

describe('unrefElement', () => {
  it('should return element directly', () => {
    const div = { nodeName: 'DIV' } as unknown as HTMLElement;
    const result = unrefElement(div);

    expect(result).toBe(div);
  });

  it('should handle signal elements', () => {
    const div = { nodeName: 'DIV' } as unknown as HTMLElement;
    const elSignal = signal(div);
    const result = unrefElement(elSignal);

    expect(result).toBe(div);
  });

  it('should handle getter functions', () => {
    const span = { nodeName: 'SPAN' } as unknown as HTMLElement;
    const getter = () => span;
    const result = unrefElement(getter);

    expect(result).toBe(span);
  });

  it('should handle ElementRef and return nativeElement', () => {
    const div = document.createElement('div');
    const elRef = { nativeElement: div } as ElementRef;
    const result = unrefElement(elRef);

    expect(result).toBe(div);
  });

  it('should handle null', () => {
    expect(unrefElement(null)).toBeNull();
  });

  it('should handle undefined', () => {
    expect(unrefElement(undefined)).toBe(undefined);
  });
});
