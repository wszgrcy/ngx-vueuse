import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayFind } from './index';

describe('useArrayFind', () => {
  it('should find array elements', () => {
    const arr = signal([1, 2, 3, 4, 5]);
    const result = useArrayFind(arr, (x) => x > 3);

    expect(result()).toBe(4);
  });

  it('should return undefined when not found', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayFind(arr, (x) => x > 10);

    expect(result()).toBe(undefined);
  });

  it('should find in object arrays', () => {
    const arr = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = useArrayFind(arr, (x) => x.id === 2);

    expect(result()).toEqual({ id: 2 });
  });

  it('should work with plain arrays', () => {
    const result = useArrayFind([1, 2, 3] as number[], (x) => x === 3);

    expect(result()).toBe(3);
  });

  it('should be reactive when first element stops matching', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayFind(arr, (x) => x > 0);

    expect(result()).toBe(1);

    arr.set([-1, 2, 3]);
    expect(result()).toBe(2);

    arr.set([-1, -2, 3]);
    expect(result()).toBe(3);

    arr.set([-1, -2, -3]);
    expect(result()).toBe(undefined);
  });

  it('should react to new elements being added', () => {
    const arr = signal([-1, -2]);
    const result = useArrayFind(arr, (x) => x > 0);

    expect(result()).toBe(undefined);

    arr.set([-1, -2, 10]);
    expect(result()).toBe(10);
  });
});
