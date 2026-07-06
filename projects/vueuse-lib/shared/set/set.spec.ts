import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { set } from './set';

describe('set', () => {
  it('should set value on signal', () => {
    const s = signal(1);
    set(s, 2);
    expect(s()).toBe(2);
  });

  it('should set property on object', () => {
    const obj = { a: 1, b: 2 };
    set(obj, 'a', 10);
    expect(obj.a).toBe(10);
    expect(obj.b).toBe(2);
  });
});
