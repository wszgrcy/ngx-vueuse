import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { extendRef } from './extendRef';

describe('extendRef', () => {
  it('should extend signal with object properties', () => {
    const s = signal(1);
    const extend = { a: 2, b: 3 };
    const result = extendRef(s, extend);

    expect(result()).toBe(1);
    expect((result as any).a).toBe(2);
    expect((result as any).b).toBe(3);
  });

  it('should skip value property', () => {
    const s = signal(1);
    const extend = { value: 999, a: 2 };
    const result = extendRef(s, extend);

    expect(result()).toBe(1);
    expect((result as any).value).toBeUndefined();
    expect((result as any).a).toBe(2);
  });

  it('should work with signal properties', () => {
    const s = signal(1);
    const s2 = signal(10);
    const extend = { s2 };
    const result = extendRef(s, extend);

    expect(result()).toBe(1);
    // Signal properties are unwrapped, so s2 should be the signal value
    expect((result as any).s2).toBe(10);
  });
});
