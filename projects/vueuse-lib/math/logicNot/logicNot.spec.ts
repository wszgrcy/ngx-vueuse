import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { logicNot } from './index';
import { toValue } from '@cyia/ngx-vueuse/shared';

describe('logicNot', () => {
  it('should be defined', () => {
    expect(logicNot).toBeDefined();
  });

  it('returns the logical complement of the given ref', () => {
    expect(toValue(logicNot(signal(true)))).toBe(false);
    expect(toValue(logicNot(signal('foo')))).toBe(false);
    expect(toValue(logicNot(signal(1)))).toBe(false);

    expect(toValue(logicNot(signal(false)))).toBe(true);
    expect(toValue(logicNot(signal('')))).toBe(true);
    expect(toValue(logicNot(signal(0)))).toBe(true);
  });

  it('returns the logical complement of the given value', () => {
    expect(toValue(logicNot(true))).toBe(false);
    expect(toValue(logicNot('foo'))).toBe(false);

    expect(toValue(logicNot(false))).toBe(true);
    expect(toValue(logicNot(''))).toBe(true);
    expect(toValue(logicNot(0))).toBe(true);
  });

  it('returns the logical complement of the given getter function', () => {
    expect(toValue(logicNot(() => true))).toBe(false);
    expect(toValue(logicNot(() => 'foo'))).toBe(false);

    expect(toValue(logicNot(() => false))).toBe(true);
    expect(toValue(logicNot(() => 0))).toBe(true);
  });
});
