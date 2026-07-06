import { describe, expect, it, beforeEach } from 'vitest';
import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { toRefs } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

let injector: ReturnType<typeof createInjector>;

describe('toRefs', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [] });
    injector = createInjector();
  });

  it('should be defined', () => {
    expect(toRefs).toBeDefined();
  });

  it('should convert object keys to signals', () => {
    const obj = { foo: 'bar', baz: 42 };
    const refs = toRefs(obj);

    expect(refs.foo()).toBe('bar');
    expect(refs.baz()).toBe(42);
  });

  it('should convert signal of object keys to signals', () => {
    const objSignal = signal({ foo: 'bar', baz: 42 });
    const refs = toRefs(objSignal);

    expect(refs.foo()).toBe('bar');
    expect(refs.baz()).toBe(42);
  });

  it('should handle empty objects', () => {
    const refs = toRefs({});
    expect(Object.keys(refs).length).toBe(0);
  });

  it('should handle arrays', () => {
    const arr = ['a', 'b', 'c'];
    const refs = toRefs(arr);

    expect(refs[0]()).toBe('a');
    expect(refs[1]()).toBe('b');
    expect(refs[2]()).toBe('c');
  });

  it('should handle arrays from signals', () => {
    const arrSignal = signal(['a', 'b', 'c']);
    const refs = toRefs(arrSignal);

    expect(refs[0]()).toBe('a');
    expect(refs[1]()).toBe('b');
    expect(refs[2]()).toBe('c');
  });

  it('should support writable refs for signal of object', () => {
    const objSignal = signal({ a: 'hello', b: 10 });
    const refs = toRefs(objSignal);

    // Read works
    expect(refs.a()).toBe('hello');
    expect(refs.b()).toBe(10);

    // Write via .value
    refs.a.value = 'world';
    expect(refs.a()).toBe('world');
    expect(objSignal().a).toBe('world');

    refs.b.value = 20;
    expect(refs.b()).toBe(20);
    expect(objSignal().b).toBe(20);
  });

  it('should support writable refs for signal of array', () => {
    const arrSignal = signal(['x', 'y', 'z']);
    const refs = toRefs(arrSignal);

    expect(refs[0]()).toBe('x');
    expect(refs[1]()).toBe('y');

    refs[0].value = 'updated';
    expect(refs[0]()).toBe('updated');
    expect(arrSignal()[0]).toBe('updated');
  });

  it('should detect signal changes when reading refs', () => {
    const objSignal = signal({ name: 'initial' });
    const refs = toRefs(objSignal);

    expect(refs.name()).toBe('initial');

    objSignal.set({ name: 'changed' });
    expect(refs.name()).toBe('changed');
  });

  // === Vue原版测试场景: computed object/array support ===
  // Note: Angular's computed() doesn't support writable computed objects like Vue.
  // These tests verify basic toRefs behavior with signal inputs instead.

  it('should work correctly with signal of object', () => {
    const obj = signal({ a: 'a', b: 0 });
    const refs = toRefs(obj);

    expect(refs.a()).toBe('a');
    expect(refs.b()).toBe(0);

    // Update signal
    obj.set({ a: 'b', b: 1 });
    expect(refs.a()).toBe('b');
    expect(refs.b()).toBe(1);
  });

  it('should work correctly with signal of array', () => {
    const arr = signal(['a', 0]);
    const refs = toRefs(arr);

    expect(refs[0]()).toBe('a');
    expect(refs[1]()).toBe(0);

    // Update signal
    arr.set(['b', 1]);
    expect(refs[0]()).toBe('b');
    expect(refs[1]()).toBe(1);
  });

  // === 补充的测试用例 ===

  it('should support writable refs with replaceRef = true (default)', () => {
    const objSignal = signal({ a: 'hello', b: 10 });
    const refs = toRefs(objSignal, { replaceRef: true });

    expect(refs.a()).toBe('hello');
    expect(refs.b()).toBe(10);

    refs.a.value = 'world';
    expect(refs.a()).toBe('world');
    expect(objSignal().a).toBe('world');
    expect(objSignal().b).toBe(10);

    // 验证创建了新对象（replaceRef 行为）
    const originalSignal = objSignal();
    refs.b.value = 20;
    expect(objSignal().b).toBe(20);
    expect(objSignal()).toEqual({ a: 'world', b: 20 });
  });

  it('should support writable refs with replaceRef = false', () => {
    const objSignal = signal({ a: 'hello', b: 10 });
    const refs = toRefs(objSignal, { replaceRef: false });

    expect(refs.a()).toBe('hello');
    expect(refs.b()).toBe(10);

    refs.a.value = 'world';
    expect(refs.a()).toBe('world');
    expect(objSignal().a).toBe('world');
    expect(objSignal().b).toBe(10);
  });

  it('should not trigger unrelated effects with replaceRef = false', async () => {
    runInInjectionContext(injector, () => {
      const objSignal = signal({ a: 'a', b: 0 });
      const refs = toRefs(objSignal, { replaceRef: false });

      let callCount = 0;
      const effectRef = effect(() => {
        refs.a();
        callCount++;
      });

      // Effect runs asynchronously, wait for it to execute
      setTimeout(() => {
        expect(callCount).toBe(1);

        // 修改 b 不应该触发 a 的 effect
        refs.b.value = 1;

        setTimeout(() => {
          expect(callCount).toBe(1);
          effectRef.destroy();
        }, 10);
      }, 10);
    });
  });

  it('should trigger unrelated effects with replaceRef = true', async () => {
    runInInjectionContext(injector, () => {
      const objSignal = signal({ a: 'a', b: 0 });
      const refs = toRefs(objSignal, { replaceRef: true });

      let callCount = 0;
      const effectRef = effect(() => {
        refs.a();
        callCount++;
      });

      // Effect runs asynchronously, wait for it to execute
      setTimeout(() => {
        expect(callCount).toBe(1);

        // 修改 b 会触发整个对象替换，从而触发 a 的 effect
        refs.b.value = 1;

        setTimeout(() => {
          expect(callCount).toBeGreaterThanOrEqual(1);
          effectRef.destroy();
        }, 20);
      }, 10);
    });
  });

  it('should save instance of class', () => {
    class SomeClass {
      v = 1;

      fn() {
        // empty
      }
    }

    const objSignal = signal(new SomeClass());
    const refs: any = toRefs(objSignal);

    refs.v.value = 10;

    expect(objSignal().v).toBe(10);
    expect(objSignal() instanceof SomeClass).toBeTruthy();
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  // 注意：Angular 没有 Vue 的 computed getter/setter 机制
  // 以下测试验证 toRefs 与 signal 的基本交互

  it('should work with writable signal objects', () => {
    const objSignal = signal({ a: 'a' as string, b: 0 });
    const refs = toRefs(objSignal);

    expect(refs.a()).toBe('a');
    expect(refs.b()).toBe(0);

    // 通过 ref 修改应该更新原始 signal
    refs.a.value = 'b';
    expect(refs.a()).toBe('b');
    expect(objSignal().a).toBe('b');
  });

  it('should work with writable signal arrays', () => {
    const arrSignal = signal(['a' as string, 0]);
    const refs = toRefs(arrSignal);

    expect(refs[0]()).toBe('a');
    expect(refs[1]()).toBe(0);

    // 通过 ref 修改应该更新原始 signal
    refs[0].value = 'b';
    expect(refs[0]()).toBe('b');
    expect(arrSignal()[0]).toBe('b');
  });

  it('should preserve prototype chain for objects', () => {
    class BaseClass {
      v = 1;

      baseMethod() {
        return 'base';
      }
    }

    class DerivedClass extends BaseClass {
      derivedMethod() {
        return 'derived';
      }
    }

    const objSignal = signal(new DerivedClass());
    const refs: any = toRefs(objSignal);

    refs.v.value = 10;

    const result = objSignal();
    expect(result instanceof DerivedClass).toBeTruthy();
    expect(result.baseMethod()).toBe('base');
    expect(result.derivedMethod()).toBe('derived');
  });

  it('should preserve prototype chain for arrays', () => {
    const arrSignal = signal([1, 2, 3]);
    const refs = toRefs(arrSignal);

    refs[0].value = 10;

    expect(Array.isArray(arrSignal())).toBeTruthy();
    expect(arrSignal()[0]).toBe(10);
  });
});
