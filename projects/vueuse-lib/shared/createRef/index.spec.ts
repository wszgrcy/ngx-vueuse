import { describe, expect, it } from 'vitest';
import { isSignal } from '@angular/core';
import { createRef } from './index';

describe('createRef', () => {
  it('should return a signal', () => {
    const a = createRef(1);
    expect(a()).toBe(1);
    (a as any).set(5);
    expect(a()).toBe(5);
  });

  it('should handle objects', () => {
    const b = createRef({ foo: 'bar', baz: 42 });
    expect(b().foo).toBe('bar');
    expect(b().baz).toBe(42);
  });

  it('should handle strings', () => {
    const c = createRef('hello');
    expect(c()).toBe('hello');
  });

  it('should handle arrays', () => {
    const d = createRef([1, 2, 3]);
    expect(d()).toEqual([1, 2, 3]);
  });

  it('should always return a signal (Angular has no deep refs)', () => {
    const e = createRef(1, true);
    expect(isSignal(e)).toBe(true);
    expect(e()).toBe(1);

    const f = createRef(1, false);
    expect(isSignal(f)).toBe(true);
    expect(f()).toBe(1);

    const g = createRef(1);
    expect(isSignal(g)).toBe(true);
    expect(g()).toBe(1);
  });

  // === Vue原版测试场景: isShallow checks ===

  it('default - returns shallow signal', () => {
    const ref = createRef(1);
    // Angular signals are always shallow by default
    expect(ref()).toBe(1);

    // Modifying nested property should NOT trigger reactivity
    const objRef = createRef({ foo: 'bar' });
    expect(objRef().foo).toBe('bar');
  });

  it('deep: true - returns deep signal', () => {
    const ref = createRef(1, true);
    expect(isSignal(ref)).toBe(true);
    expect(ref()).toBe(1);
  });

  it('deep: false - returns shallow signal', () => {
    const ref = createRef(1, false);
    expect(isSignal(ref)).toBe(true);
    expect(ref()).toBe(1);
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should support deep reactivity with deep: true', () => {
    const obj: any = createRef({ foo: 'bar', baz: 42 }, true);

    expect(obj().foo).toBe('bar');
    expect(obj().baz).toBe(42);

    // 深度修改应该能正确更新
    obj.set({ ...obj(), foo: 'baz' });
    expect(obj().foo).toBe('baz');
  });

  it('should work with nested objects', () => {
    const obj: any = createRef(
      {
        nested: {
          deep: {
            value: 42,
          },
        },
      },
      true,
    );

    // createRef 返回 Signal，需要用 () 访问
    expect(obj().nested.deep.value).toBe(42);

    // 替换整个对象
    obj.set({
      nested: {
        deep: {
          value: 100,
        },
      },
    });
    expect(obj().nested.deep.value).toBe(100);
  });
});
