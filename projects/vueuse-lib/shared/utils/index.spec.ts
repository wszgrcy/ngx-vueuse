import { describe, expect, it } from 'vitest';
import { isClient, isDef, notNullish, isObject, clamp, noop, hasOwn, now, timestamp } from './is';
import { promiseTimeout, identity, createSingletonPromise } from './general';
import { hyphenate, camelize } from './port';

describe('is.ts utilities', () => {
  it('isClient should be true in jsdom test environment', () => {
    expect(isClient).toBe(true);
  });

  it('isDef should check for undefined', () => {
    expect(isDef(0)).toBe(true);
    expect(isDef('')).toBe(true);
    expect(isDef(null)).toBe(true);
    expect(isDef(undefined)).toBe(false);
  });

  it('notNullish should check for null and undefined', () => {
    expect(notNullish(0)).toBe(true);
    expect(notNullish('')).toBe(true);
    expect(notNullish(false)).toBe(true);
    expect(notNullish(null)).toBe(false);
    expect(notNullish(undefined)).toBe(false);
  });

  it('isObject should check plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
  });

  it('clamp should clamp values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('noop should be a function that does nothing', () => {
    expect(typeof noop).toBe('function');
    expect(noop()).toBe(undefined);
  });

  it('hasOwn should check own properties', () => {
    const obj = { a: 1 } as any;
    expect(hasOwn(obj, 'a')).toBe(true);
    expect(hasOwn(obj, 'b')).toBe(false);
  });

  it('now should return a number', () => {
    const before = Date.now();
    const n = now();
    const after = Date.now();
    expect(typeof n).toBe('number');
    expect(n).toBeGreaterThanOrEqual(before);
    expect(n).toBeLessThanOrEqual(after);
  });

  it('timestamp should return a number', () => {
    const t = timestamp();
    expect(typeof t).toBe('number');
    expect(t > 0).toBe(true);
  });
});

describe('general.ts utilities', () => {
  it('promiseTimeout should resolve after ms', async () => {
    const start = Date.now();
    await promiseTimeout(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('identity should return the same value', () => {
    expect(identity(1)).toBe(1);
    expect(identity('test')).toBe('test');
    expect(identity({})).toEqual({});
  });

  it('createSingletonPromise should cache results', async () => {
    let callCount = 0;
    const fn = () => {
      callCount++;
      return Promise.resolve(callCount);
    };
    const singleton = createSingletonPromise(fn);

    const result1 = await singleton();
    const result2 = await singleton();
    expect(result1).toBe(1);
    expect(result2).toBe(1); // Same promise, not called again
  });
});

describe('port.ts utilities', () => {
  it('hyphenate should convert camelCase to kebab-case', () => {
    expect(hyphenate('fooBar')).toBe('foo-bar');
    expect(hyphenate('XMLHttpRequest')).toBe('x-m-l-http-request');
    expect(hyphenate('already-kebab')).toBe('already-kebab');
  });

  it('camelize should convert kebab-case to camelCase', () => {
    expect(camelize('foo-bar')).toBe('fooBar');
    expect(camelize('xml-http-request')).toBe('xmlHttpRequest');
    expect(camelize('alreadyCamel')).toBe('alreadyCamel');
  });

  it('hyphenate should cache results', () => {
    const result1 = hyphenate('testValue');
    const result2 = hyphenate('testValue');
    expect(result1).toBe(result2);
  });

  it('camelize should cache results', () => {
    const result1 = camelize('test-value');
    const result2 = camelize('test-value');
    expect(result1).toBe(result2);
  });
});
