import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { get } from './get';

describe('get', () => {
  it('should return the value for a signal', () => {
    const s = signal(42);
    expect(get(s)).toBe(42);
  });

  it('should return the value for a plain value', () => {
    expect(get(42)).toBe(42);
  });

  it('should get a property from an object', () => {
    const obj = { a: 1, b: 2 };
    expect(get(obj, 'a')).toBe(1);
    expect(get(obj, 'b')).toBe(2);
  });

  it('should get a property from a signal containing an object', () => {
    const obj = { a: 1, b: 2 };
    expect(get(obj, 'a')).toBe(1);
    expect(get(obj, 'b')).toBe(2);
  });
});
