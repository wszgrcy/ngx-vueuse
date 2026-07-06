import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayDifference } from './index';

describe('useArrayDifference', () => {
  it('should return elements in first but not second array', () => {
    const arr1 = signal([1, 2, 3, 4]);
    const arr2 = signal([2, 4]);
    const result = useArrayDifference(arr1, arr2);

    expect(result()).toEqual([1, 3]);
  });

  it('should handle empty arrays', () => {
    const arr1 = signal([1, 2, 3]);
    const arr2 = signal<number[]>([]);
    const result = useArrayDifference(arr1, arr2);

    expect(result()).toEqual([1, 2, 3]);
  });

  it('should handle string arrays', () => {
    const arr1 = signal(['a', 'b', 'c']);
    const arr2 = signal(['b']);
    const result = useArrayDifference(arr1, arr2);

    expect(result()).toEqual(['a', 'c']);
  });

  it('should work with plain arrays', () => {
    const result = useArrayDifference([1, 2, 3] as number[], [2]);

    expect(result()).toEqual([1, 3]);
  });

  it('should be reactive when signal changes', () => {
    const arr1 = signal([1, 2, 3, 4, 5]);
    const arr2 = signal([4, 5, 6]);
    const result = useArrayDifference(arr1, arr2);

    expect(result()).toEqual([1, 2, 3]);

    arr2.set([1, 2, 3]);
    expect(result()).toEqual([4, 5]);

    arr1.set([1, 2, 3]);
    expect(result()).toEqual([]);
  });

  it('should work with object arrays using default equality', () => {
    const objArr1 = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const objArr2 = signal([{ id: 3 }, { id: 4 }]);
    const result = useArrayDifference(objArr1, objArr2);

    // Object equality uses reference equality, so same structure but different refs are kept
    expect(result()).toHaveLength(3);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with iteratee function comparator', () => {
    const list1 = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
    const list2 = signal([{ id: 4 }, { id: 5 }]);

    const result = useArrayDifference(
      list1,
      list2,
      (value: any, otherVal: any) => value.id === otherVal.id,
    );

    expect(result()).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);

    list2.set([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(result()).toEqual([{ id: 4 }, { id: 5 }]);

    list1.set([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(result()).toEqual([]);
  });

  it('should work with key string comparator', () => {
    const list1 = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
    const list2 = signal([{ id: 3 }, { id: 4 }, { id: 5 }]);

    const result = useArrayDifference(list1, list2, 'id');

    expect(result()).toEqual([{ id: 1 }, { id: 2 }]);

    list2.set([{ id: 1 }, { id: 2 }]);
    expect(result()).toEqual([{ id: 3 }, { id: 4 }, { id: 5 }]);

    list1.set([{ id: 1 }, { id: 2 }]);
    expect(result()).toEqual([]);
  });

  it('should support symmetric diff with key', () => {
    const list1 = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
    const list2 = signal([{ id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);

    const result = useArrayDifference(list1, list2, 'id', { symmetric: true });

    expect(result()).toEqual([{ id: 1 }, { id: 2 }, { id: 6 }]);

    list2.set([{ id: 1 }, { id: 2 }]);
    expect(result()).toEqual([{ id: 3 }, { id: 4 }, { id: 5 }]);

    list1.set([{ id: 1 }, { id: 2 }]);
    expect(result()).toEqual([]);
  });

  it('should support symmetric diff with iteratee function', () => {
    const list1 = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
    const list2 = signal([{ id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);

    const result = useArrayDifference(list1, list2, (x: any, y: any) => x.id === y.id, {
      symmetric: true,
    });

    expect(result()).toEqual([{ id: 1 }, { id: 2 }, { id: 6 }]);

    list2.set([{ id: 6 }, { id: 7 }]);
    expect(result()).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
      { id: 6 },
      { id: 7 },
    ]);

    list1.set([{ id: 6 }, { id: 7 }]);
    expect(result()).toEqual([]);
  });
});
