import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayFindLast } from './index';

describe('useArrayFindLast', () => {
  it('should find last matching element', () => {
    const arr = signal([1, 2, 3, 2, 1]);
    const result = useArrayFindLast(arr, (x) => x === 2);

    expect(result()).toBe(2);
  });

  it('should return undefined if not found', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayFindLast(arr, (x) => x > 10);

    expect(result()).toBe(undefined);
  });

  it('should work with plain arrays', () => {
    const result = useArrayFindLast(['a', 'b', 'c'] as string[], (x) => x === 'c');

    expect(result()).toBe('c');
  });

  it('should be reactive when last matching element stops matching', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayFindLast(arr, (x) => x > 0);

    expect(result()).toBe(3);

    arr.set([1, 2, -3]);
    expect(result()).toBe(2);

    arr.set([1, -2, -3]);
    expect(result()).toBe(1);

    arr.set([-1, -2, -3]);
    expect(result()).toBe(undefined);
  });

  it('should react to new elements being appended', () => {
    const arr = signal([-1, -2]);
    const result = useArrayFindLast(arr, (x) => x > 0);

    expect(result()).toBe(undefined);

    arr.set([-1, -2, 10, 5]);
    expect(result()).toBe(5);
  });
});
