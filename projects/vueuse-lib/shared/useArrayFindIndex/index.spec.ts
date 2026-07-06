import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayFindIndex } from './index';

describe('useArrayFindIndex', () => {
  it('should find index of matching element', () => {
    const arr = signal([1, 2, 3, 4]);
    const result = useArrayFindIndex(arr, (x) => x === 3);

    expect(result()).toBe(2);
  });

  it('should return -1 if not found', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayFindIndex(arr, (x) => x > 10);

    expect(result()).toBe(-1);
  });

  it('should work with plain arrays', () => {
    const result = useArrayFindIndex(['a', 'b', 'c'] as string[], (x) => x === 'b');

    expect(result()).toBe(1);
  });

  it('should be reactive when signal changes', () => {
    const arr = signal([0, 2, 4, 6, 8]);
    const result = useArrayFindIndex(arr, (x) => x % 2 === 0);

    expect(result()).toBe(0);

    arr.set([-1, 0, 2, 4]);
    expect(result()).toBe(1);
  });

  it('should return -1 reactively when no match', () => {
    const arr = signal([1, 3, 5]);
    const result = useArrayFindIndex(arr, (x) => x % 2 === 0);

    expect(result()).toBe(-1);

    arr.set([1, 3, 4]);
    expect(result()).toBe(2);
  });
});
