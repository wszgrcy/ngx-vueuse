import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArraySome } from './index';

describe('useArraySome', () => {
  it('should return true if some elements match', () => {
    const arr = signal([1, 2, 3]);
    const result = useArraySome(arr, (x) => x > 2);

    expect(result()).toBe(true);
  });

  it('should return false if no elements match', () => {
    const arr = signal([1, 2, 3]);
    const result = useArraySome(arr, (x) => x > 10);

    expect(result()).toBe(false);
  });

  it('should work with plain arrays', () => {
    const result = useArraySome(['a', 'b', 'c'] as string[], (x) => x === 'b');

    expect(result()).toBe(true);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with array of signals', () => {
    const item1 = signal(1);
    const item2 = signal(5);
    const item3 = signal(3);
    const list: any = [item1, item2, item3];
    // resolveAll 会自动解包 signal，所以回调接收的是 T 而不是 Signal
    const result = useArraySome(list, (i: number) => i > 4);

    expect(result()).toBe(true); // item2 = 5 > 4

    // 修改 signal 应该影响结果
    item2.set(2);
    expect(result()).toBe(false); // 所有值都 <= 4
  });

  it('should work with reactive array (signal replacement)', () => {
    const arr = signal([1, 2, 3]);
    const result = useArraySome(arr, (x) => x > 2);

    expect(result()).toBe(true);

    // 通过 set 替换整个数组
    arr.set([1, 2]);
    expect(result()).toBe(false);
  });
});
