import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useArrayJoin } from './index';

describe('useArrayJoin', () => {
  it('should join array with default separator', () => {
    const arr = signal(['a', 'b', 'c']);
    const result = useArrayJoin(arr);

    expect(result()).toBe('a,b,c');
  });

  it('should join array with custom separator', () => {
    const arr = signal(['a', 'b', 'c']);
    const result = useArrayJoin(arr, '-');

    expect(result()).toBe('a-b-c');
  });

  it('should handle number arrays', () => {
    const arr = signal([1, 2, 3]);
    const result = useArrayJoin(arr, ', ');

    expect(result()).toBe('1, 2, 3');
  });

  it('should work with plain arrays', () => {
    const result = useArrayJoin(['x', 'y'] as string[], '|');

    expect(result()).toBe('x|y');
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should work with array of signals', () => {
    const item1 = signal('a');
    const item2 = signal('b');
    const item3 = signal('c');
    const list = [item1, item2, item3];
    const result = useArrayJoin(list, '-');

    expect(result()).toBe('a-b-c');

    // 修改单个 signal 应该触发重新连接
    item1.set('A');
    expect(result()).toBe('A-b-c');
  });

  it('should handle reactive separator', () => {
    const arr = signal(['a', 'b', 'c']);
    const separator = signal('-');
    const result = useArrayJoin(arr, separator);

    expect(result()).toBe('a-b-c');

    // 修改分隔符应该影响连接结果
    separator.set(' | ');
    expect(result()).toBe('a | b | c');
  });
});
