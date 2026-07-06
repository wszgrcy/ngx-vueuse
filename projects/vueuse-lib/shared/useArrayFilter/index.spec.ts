import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayFilter } from './index';

describe('useArrayFilter', () => {
  it('should filter array elements', () => {
    const arr = signal([1, 2, 3, 4, 5]);
    const result = useArrayFilter(arr, (x) => x % 2 === 0);

    expect(result()).toEqual([2, 4]);
  });

  it('should handle empty results', () => {
    const arr = signal([1, 3, 5]);
    const result = useArrayFilter(arr, (x) => x % 2 === 0);

    expect(result()).toEqual([]);
  });

  it('should handle string arrays', () => {
    const arr = signal(['apple', 'banana', 'avocado']);
    const result = useArrayFilter(arr, (x) => x.startsWith('a'));

    expect(result()).toEqual(['apple', 'avocado']);
  });

  it('should work with plain arrays', () => {
    const result = useArrayFilter([1, 2, 3, 4] as number[], (x) => x > 2);

    expect(result()).toEqual([3, 4]);
  });

  it('should be reactive when signal changes', () => {
    const arr = signal([0, 1, 2, 3, 4, 5, 6]);
    const result = useArrayFilter(arr, (x) => x % 2 === 0);

    expect(result()).toEqual([0, 2, 4, 6]);

    arr.set([0, 1, 2, 3, 4]);
    expect(result()).toEqual([0, 2, 4]);
  });

  it('should filter with boolean predicate', () => {
    const arr = signal([0, 1, 2, 3, 4, 5]);
    const result = useArrayFilter(arr, (x) => x % 2 === 1);

    expect(result()).toEqual([1, 3, 5]);
  });

  it('should react to array mutation via set', () => {
    const arr = signal([0, 2, 4, 6, 8]);
    const result = useArrayFilter(arr, (x) => x > 3);

    expect(result()).toEqual([4, 6, 8]);

    arr.set([1, 3, 5, 7]);
    expect(result()).toEqual([5, 7]);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with array of signals', () => {
    const item1 = signal(1);
    const item2 = signal(2);
    const item3 = signal(3);
    const list: any = [item1, item2, item3];
    // resolveAll 会自动解包 signal，所以回调接收的是 T 而不是 Signal
    const result = useArrayFilter(list, (i: number) => i > 1);

    expect(result()).toEqual([2, 3]);

    // 修改 signal 应该影响过滤结果
    item1.set(5);
    expect(result()).toEqual([5, 2, 3]);
  });

  it('should allow values other than boolean in predicate', () => {
    const arr = signal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const result = useArrayFilter(arr, (x) => x % 2 !== 0);

    // 非零值是 truthy，所以奇数会被保留
    expect(result()).toEqual([1, 3, 5, 7, 9]);
  });
});
