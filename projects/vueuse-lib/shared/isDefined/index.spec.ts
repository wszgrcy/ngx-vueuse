import { describe, expect, it } from 'vitest';
import { computed, signal } from '@angular/core';
import { isDefined } from './index';

describe('isDefined', () => {
  it('should be defined', () => {
    expect(isDefined).toBeDefined();
  });

  it('should support signals', () => {
    const definedSignal = signal('test');
    const undefinedSignal = signal(undefined);
    const nullSignal = signal(null);

    expect(isDefined(definedSignal)).toBe(true);
    expect(isDefined(undefinedSignal)).toBe(false);
    expect(isDefined(nullSignal)).toBe(false);
  });

  it('should support computed signals', () => {
    const definedComputed = computed(() => 'test');
    const undefinedComputed = computed(() => undefined);
    const nullComputed = computed(() => null);

    expect(isDefined(definedComputed)).toBe(true);
    expect(isDefined(undefinedComputed)).toBe(false);
    expect(isDefined(nullComputed)).toBe(false);
  });

  it('should support values', () => {
    const definedValue = 'test';
    const undefinedValue = undefined;
    const nullValue = null;

    expect(isDefined(definedValue)).toBe(true);
    expect(isDefined(undefinedValue)).toBe(false);
    expect(isDefined(nullValue)).toBe(false);
  });
});
