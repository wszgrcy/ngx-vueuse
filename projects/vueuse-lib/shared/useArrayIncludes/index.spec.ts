import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayIncludes } from './index';

describe('useArrayIncludes', () => {
  it('should return true if array includes value', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayIncludes(arr, 2);

    expect(result()).toBe(true);
  });

  it('should return false if array does not include value', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayIncludes(arr, 5);

    expect(result()).toBe(false);
  });

  it('should handle string arrays', () => {
    const arr = signal(['apple', 'banana', 'cherry']);
    const result = useArrayIncludes(arr, 'banana');

    expect(result()).toBe(true);
  });

  it('should handle fromIndex parameter', () => {
    const arr = signal([1, 2, 3, 2]);
    const result = useArrayIncludes(arr, 2, 3);

    expect(result()).toBe(true);
  });

  it('should work with plain arrays', () => {
    const result = useArrayIncludes([1, 2, 3] as number[], 1);

    expect(result()).toBe(true);
  });

  it('should work with fromIndex parameter', () => {
    const arr = signal([0, 1, 2, 3]);
    const result = useArrayIncludes(arr, 1, 2);

    expect(result()).toBe(false); // 1 is at index 1, but fromIndex starts at 2
  });

  it('should be reactive when signal changes', () => {
    const arr = signal([0, 2, 4, 6]);
    const result = useArrayIncludes(arr, 8);

    expect(result()).toBe(false);

    arr.set([0, 2, 4, 6, 8]);
    expect(result()).toBe(true);

    arr.set([0, 2, 4, 6]);
    expect(result()).toBe(false);
  });

  it('should be reactive with object search value', () => {
    const arr = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const obj = { id: 2 };
    const result = useArrayIncludes(arr, obj as any);

    expect(result()).toBe(false); // Different reference

    arr.set([{ id: 1 }, obj, { id: 3 }]);
    expect(result()).toBe(true);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with property name comparator', () => {
    const arr = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = useArrayIncludes(arr, 3, 'id');

    expect(result()).toBe(true);

    arr.set([{ id: 1 }, { id: 2 }]);
    expect(result()).toBe(false);
  });

  it('should work with custom comparator function', () => {
    const arr = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = useArrayIncludes(
      arr,
      { id: 3 },
      (element: any, value: any) => element.id === value.id,
    );

    expect(result()).toBe(true);

    arr.set([{ id: 1 }, { id: 2 }]);
    expect(result()).toBe(false);
  });

  it('should work with fromIndex and comparator combination', () => {
    const arr = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = useArrayIncludes(
      arr,
      { id: 1 },
      {
        fromIndex: 1,
        comparator: (element: any, value: any) => element.id === value.id,
      },
    );

    // id:1 在索引 0，但从索引 1 开始搜索，所以应该返回 false
    expect(result()).toBe(false);
  });
});
