import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { isDefined } from './isDefined';

describe('isDefined', () => {
  it('should return true for defined values', () => {
    expect(isDefined(1)).toBe(true);
    expect(isDefined('test')).toBe(true);
    expect(isDefined({})).toBe(true);
    expect(isDefined([])).toBe(true);
    expect(isDefined(signal(1)())).toBe(true);
  });

  it('should return false for null or undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });

  it('should work with signals', () => {
    const s1 = signal(1);
    const s2 = signal(null);
    const s3 = signal(undefined);

    expect(isDefined(s1)).toBe(true);
    expect(isDefined(s2)).toBe(false);
    expect(isDefined(s3)).toBe(false);
  });
});
