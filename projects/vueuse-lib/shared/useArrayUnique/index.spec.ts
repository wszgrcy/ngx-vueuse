import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayUnique } from './index';

describe('useArrayUnique', () => {
  it('should remove duplicate elements', () => {
    const arr = signal([1, 2, 2, 3, 3, 3]);
    const result = useArrayUnique(arr);

    expect(result()).toEqual([1, 2, 3]);
  });

  it('should handle empty arrays', () => {
    const arr = signal<number[]>([]);
    const result = useArrayUnique(arr);

    expect(result()).toEqual([]);
  });

  it('should handle strings', () => {
    const arr = signal(['a', 'b', 'a', 'c', 'b']);
    const result = useArrayUnique(arr);

    expect(result()).toEqual(['a', 'b', 'c']);
  });

  it('should work with plain arrays', () => {
    const result = useArrayUnique([1, 1, 2, 2, 3] as number[]);

    expect(result()).toEqual([1, 2, 3]);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with custom compare function', () => {
    const arr = signal([
      { id: 1, name: 'foo' },
      { id: 2, name: 'bar' },
      { id: 1, name: 'baz' },
    ]);
    const result = useArrayUnique(arr, (a: any, b: any) => a.id === b.id);

    expect((result() as any[]).length).toBe(2);
  });

  it('should work with array of signals', () => {
    const item1 = signal(0);
    const item2 = signal(1);
    const item3 = signal(1);
    const item4 = signal(2);
    const item5 = signal(3);
    const list: any = [item1, item2, item3, item4, item5];
    const result = useArrayUnique(list);

    expect((result() as any[]).length).toBe(4);

    item5.set(2);
    expect((result() as any[]).length).toBe(3);
  });
});
