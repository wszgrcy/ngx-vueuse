import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayMap } from './index';

describe('useArrayMap', () => {
  it('should map array elements', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayMap(arr, (x) => x * 2);

    expect(result()).toEqual([2, 4, 6]);
  });

  it('should handle empty arrays', () => {
    const arr = signal<number[]>([]);
    const result = useArrayMap(arr, (x) => x * 2);

    expect(result()).toEqual([]);
  });

  it('should handle string arrays', () => {
    const arr = signal(['a', 'b', 'c']);
    const result = useArrayMap(arr, (x) => x.toUpperCase());

    expect(result()).toEqual(['A', 'B', 'C']);
  });

  it('should handle object arrays', () => {
    const arr = signal([{ name: 'Alice' }, { name: 'Bob' }]);
    const result = useArrayMap(arr, (x) => x.name);

    expect(result()).toEqual(['Alice', 'Bob']);
  });

  it('should work with plain arrays', () => {
    const result = useArrayMap([1, 2, 3] as number[], (x) => x + 1);

    expect(result()).toEqual([2, 3, 4]);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with array of signals', () => {
    const item1 = signal(0);
    const item2 = signal(2);
    const list: any = [item1, item2];
    // resolveAll 会自动解包 signal，所以回调接收的是 T 而不是 Signal
    const result = useArrayMap(list, (i: number) => i * 2);

    expect(result()).toEqual([0, 4]);

    // 修改单个 signal 应该触发重新计算
    item1.set(1);
    expect(result()).toEqual([2, 4]);
  });

  it('should return correct mapped type', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayMap(arr, (x: number) => x.toString());

    // 验证返回类型是字符串数组
    expect(result()).toEqual(['1', '2', '3']);
    expect(typeof (result() as any)[0]).toBe('string');
  });
});
