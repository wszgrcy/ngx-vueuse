import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useMath } from './index';

describe('useMath', () => {
  it('should be defined', () => {
    expect(useMath).toBeDefined();
  });

  it('should accept numbers', () => {
    const v = useMath('pow', 2, 3);
    expect(v()).toBe(8);
  });

  it('should accept refs', () => {
    const base = signal(2);
    const exponent = signal(3);
    const result = useMath('pow', base, exponent);

    expect(result()).toBe(8);

    const num = signal(4);
    const root = useMath('sqrt', num);

    expect(root()).toBe(2);

    num.set(16);
    expect(root()).toBe(4);
  });
});
