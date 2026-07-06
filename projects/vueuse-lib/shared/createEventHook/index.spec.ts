import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createEventHook } from './index';

describe('createEventHook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger event', () => {
    let message = '';

    const myFunction = () => {
      const resultEvent = createEventHook<string>();
      const exec = () => resultEvent.trigger('Hello World');
      return {
        exec,
        onResult: resultEvent.on,
      };
    };

    const { exec, onResult } = myFunction();
    onResult((result) => (message = result));
    exec();

    expect(message).toBe('Hello World');
  });

  it('should trigger event with no params', () => {
    let timesFired = 0;

    const { on: onResult, trigger } = createEventHook();

    onResult(() => timesFired++);
    trigger();
    trigger();

    expect(timesFired).toBe(2);
  });

  it('should trigger event and pass falsy values', () => {
    let timesFired = 0;

    type Falsy = false | 0 | '' | null | undefined;
    const { on: onResult, trigger } = createEventHook<Falsy>();

    const values: Falsy[] = [false, 0, '', null, undefined];
    const results: Falsy[] = [];
    onResult((value: Falsy) => {
      timesFired++;
      results.push(value);
    });
    for (const value of values) trigger(value);

    expect(timesFired).toBe(values.length);
    expect(results).toMatchObject(values);
  });

  it('should add and remove event listener', () => {
    const listener = vi.fn();
    const { on, off, trigger } = createEventHook<string>();

    on(listener);

    trigger('xxx');

    expect(listener).toHaveBeenCalledTimes(1);

    off(listener);

    trigger('xxx');

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should clear all event listeners', () => {
    const listener = vi.fn();
    const { on, clear, trigger } = createEventHook<string>();

    on(listener);
    on(listener);

    clear();

    trigger('xxx');

    expect(listener).not.toHaveBeenCalled();
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('the same listener should fire only once', () => {
    const listener = vi.fn();
    const { on, trigger, off } = createEventHook<string>();

    on(listener);
    on(listener); // 重复注册
    trigger('xxx');

    expect(listener).toBeCalledTimes(1);
    off(listener);
  });

  it('should return remove function from on()', () => {
    const listener = vi.fn();
    const { on, trigger } = createEventHook<string>();

    const { off: remove } = on(listener);

    trigger('xxx');
    expect(listener).toHaveBeenCalledTimes(1);

    remove();

    trigger('xxx');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should clear all different types of listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const listener3 = vi.fn();

    const { on, clear, trigger } = createEventHook<string>();

    on(listener1);
    on(listener2);
    on(listener3);

    trigger('xxx');

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(1);

    clear();

    trigger('xxx');

    // 清除后所有监听器都不应该再被调用
    // 但之前的调用次数保持不变
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(1);
  });

  it('should await trigger and return results', async () => {
    const { on, trigger } = createEventHook<string>();

    on(
      (value) =>
        new Promise<number>((resolve) => {
          resolve(value.length);
        }),
    );

    const results = await trigger('hello');
    expect(results).toEqual([5]);
  });

  it('multiple parameters on trigger with types', () => {
    let id = '';
    const list: unknown[] = [];
    const { on: onResult, trigger } = createEventHook<string>();

    onResult((_id) => (id = _id));
    onResult((str, ...rest) => {
      list.push(str, ...rest);
    });

    trigger('foo', 1, true, 'bar');

    expect(id).toEqual('foo');
    expect(list).toEqual(['foo', 1, true, 'bar']);
  });

  it('should support trigger with multiple parameters', () => {
    const results: any[] = [];
    const { on, trigger } = createEventHook<string>();

    on((...args: any[]) => {
      results.push(args);
    });

    trigger('arg1', 'arg2', 'arg3');

    expect(results[0]).toEqual(['arg1', 'arg2', 'arg3']);
  });
});
