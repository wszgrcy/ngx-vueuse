import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayReduce } from './index';

describe('useArrayReduce', () => {
  it('should reduce array to single value', () => {
    const arr = signal([1, 2, 3, 4]);
    const result = useArrayReduce(arr, (acc, cur) => acc + cur, 0);

    expect(result()).toBe(10);
  });

  it('should handle multiply reduction', () => {
    const arr = signal([1, 2, 3, 4]);
    const result = useArrayReduce(arr, (acc, cur) => acc * cur, 1);

    expect(result()).toBe(24);
  });

  it('should handle string reduction', () => {
    const arr = signal(['a', 'b', 'c']);
    const result = useArrayReduce(arr, (acc, cur) => acc + cur, '');

    expect(result()).toBe('abc');
  });

  it('should work with plain arrays', () => {
    const result = useArrayReduce([1, 2, 3] as number[], (acc, cur) => acc + cur, 0);

    expect(result()).toBe(6);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with initialValue being a function', () => {
    const arr = signal([{ num: 1 }, { num: 2 }]);
    const result = useArrayReduce(
      arr,
      (prev, val) => {
        prev.push(val.num);
        return prev;
      },
      () => [] as number[],
    );

    expect(result()).toEqual([1, 2]);

    arr.set([...arr(), { num: 3 }]);
    expect(result()).toEqual([1, 2, 3]);
  });

  it('should work with array of signals', () => {
    const item1 = signal(1);
    const item2 = signal(2);
    const item3 = signal(3);
    const list: any = [item1, item2, item3];
    // resolveAll 会自动解包 signal，所以回调接收的是 T 而不是 Signal
    const result = useArrayReduce(list, (acc: number, cur: number) => acc + cur, 0);

    expect(result()).toBe(6);

    // 修改 signal 应该影响归并结果
    item1.set(10);
    expect(result()).toBe(15);
  });
});
