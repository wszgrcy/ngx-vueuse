import { describe, it, expect } from 'vitest';
import { signal } from '@angular/core';
import { createUnrefFn } from './createUnrefFn';

describe('createUnrefFn', () => {
  it('should pass through raw values unchanged', () => {
    const fn = (a: number, b: number) => a + b;
    const unrefFn = createUnrefFn(fn);
    expect(unrefFn(1, 2)).toBe(3);
  });

  it('should unwrap signal arguments', () => {
    const fn = (a: number, b: number) => a + b;
    const unrefFn = createUnrefFn(fn);
    expect(unrefFn(signal(1), signal(2))).toBe(3);
  });

  it('should handle mixed signal and raw arguments', () => {
    const fn = (a: string, b: number) => `${a}${b}`;
    const unrefFn = createUnrefFn(fn);
    expect(unrefFn(signal('hello'), 42)).toBe('hello42');
    expect(unrefFn('world', signal(100))).toBe('world100');
  });

  it('should preserve `this` context', () => {
    const obj = {
      value: 10,
      fn(this: { value: number }, a: number) {
        return this.value + a;
      },
    };
    const unrefFn = createUnrefFn(obj.fn);
    expect(unrefFn.call(obj, signal(5))).toBe(15);
  });

  it('should handle functions with no arguments', () => {
    const fn = () => 'hello';
    const unrefFn = createUnrefFn(fn);
    expect(unrefFn()).toBe('hello');
  });

  it('should handle functions returning complex values', () => {
    const fn = (a: number, b: number) => ({ sum: a + b, product: a * b });
    const unrefFn = createUnrefFn(fn);
    const result = unrefFn(signal(3), signal(4));
    expect(result).toEqual({ sum: 7, product: 12 });
  });

  it('should handle getter function arguments', () => {
    const fn = (a: number) => a * 2;
    const unrefFn = createUnrefFn(fn);
    expect(unrefFn(() => 21)).toBe(42);
  });

  it('should handle multiple mixed argument types', () => {
    const fn = (a: string, b: number, c: boolean) => `${a}-${b}-${c}`;
    const unrefFn = createUnrefFn(fn);
    expect(unrefFn(signal('x'), 42, signal(true))).toBe('x-42-true');
  });
});
