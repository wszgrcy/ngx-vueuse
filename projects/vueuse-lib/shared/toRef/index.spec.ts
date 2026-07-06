import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { toRef } from './index';

describe('toRef', () => {
  it('should convert a plain value to signal', () => {
    const s = toRef(42);
    expect(s()).toBe(42);
  });

  it('should convert a getter function to computed', () => {
    const s = toRef(() => 'computed-value');
    expect(s()).toBe('computed-value');
  });

  it('should handle objects', () => {
    const obj = { key: 'value' };
    const s = toRef(obj);
    expect(s().key).toBe('value');
  });

  it('should handle null/undefined', () => {
    expect(toRef(null)()).toBe(null);
    expect(toRef(undefined)()).toBe(undefined);
  });

  // === Vue原版测试场景补充 ===

  it('should convert boolean values', () => {
    expect(toRef(true)()).toBe(true);
    expect(toRef(false)()).toBe(false);
  });

  it('should convert array values', () => {
    const arr = [1, 2, 3];
    const s = toRef(arr);
    expect(s()).toEqual(arr);
  });

  it('should convert function getters that return signals', () => {
    const inner = signal('inner-value');
    const s = toRef(() => inner());
    expect(s()).toBe('inner-value');

    inner.set('updated-inner');
    expect(s()).toBe('updated-inner');
  });

  it('should handle zero values', () => {
    expect(toRef(0)()).toBe(0);
  });

  it('should handle empty string values', () => {
    expect(toRef('')()).toBe('');
  });

  it('should handle nested objects', () => {
    const obj = { nested: { deep: 'value' } };
    const s = toRef(obj);
    expect(s().nested.deep).toBe('value');
  });

  it('should be callable as a signal', () => {
    const s = toRef(42);
    expect(typeof s).toBe('function');
    expect(s()).toBe(42);
  });
});
