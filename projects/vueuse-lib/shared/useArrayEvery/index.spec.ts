import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayEvery } from './index';

describe('useArrayEvery', () => {
  it('should return true if all elements match', () => {
    const arr = signal([2, 4, 6]);
    const result = useArrayEvery(arr, (x) => x % 2 === 0);

    expect(result()).toBe(true);
  });

  it('should return false if not all elements match', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayEvery(arr, (x) => x % 2 === 0);

    expect(result()).toBe(false);
  });

  it('should work with plain arrays', () => {
    const result = useArrayEvery([10, 20, 30] as number[], (x) => x > 5);

    expect(result()).toBe(true);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with array of signals', () => {
    const item1 = signal(2);
    const item2 = signal(4);
    const item3 = signal(6);
    const list: any = [item1, item2, item3];
    // resolveAll 会自动解包 signal，所以回调接收的是 T 而不是 Signal
    const result = useArrayEvery(list, (i: number) => i % 2 === 0);

    expect(result()).toBe(true); // 所有值都是偶数

    // 修改 signal 应该影响结果
    item1.set(3);
    expect(result()).toBe(false); // 3 不是偶数
  });

  it('should work with reactive array (signal replacement)', () => {
    const arr = signal([2, 4, 6]);
    const result = useArrayEvery(arr, (x) => x > 0);

    expect(result()).toBe(true);

    // 通过 set 替换整个数组
    arr.set([1, -2, 3]);
    expect(result()).toBe(false); // -2 <= 0
  });
});
