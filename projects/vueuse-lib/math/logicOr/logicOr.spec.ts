import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { logicOr } from './index';
import { toValue } from '@cyia/ngx-vueuse/shared';

describe('logicOr', () => {
  it('should be defined', () => {
    expect(logicOr).toBeDefined();
  });

  it('returns false when given no args', () => {
    expect(toValue(logicOr())).toBe(false);
  });

  it('returns true only when any arguments are truthy', () => {
    expect(toValue(logicOr(signal(true), signal(true)))).toBe(true);
    expect(toValue(logicOr(signal('foo'), signal(false)))).toBe(true);
    expect(toValue(logicOr(signal('foo'), signal(1), signal(false)))).toBe(true);

    expect(toValue(logicOr(signal(false), signal(false)))).toBe(false);
    expect(toValue(logicOr(signal(''), signal(0)))).toBe(false);
  });

  it('works with values', () => {
    expect(toValue(logicOr(true))).toBe(true);
    expect(toValue(logicOr(true, false))).toBe(true);
    expect(toValue(logicOr('foo'))).toBe(true);

    expect(toValue(logicOr(false))).toBe(false);
    expect(toValue(logicOr(''))).toBe(false);
    expect(toValue(logicOr(0))).toBe(false);
  });

  it('works with getter functions', () => {
    expect(toValue(logicOr(() => true))).toBe(true);
    expect(
      toValue(
        logicOr(
          () => true,
          () => false,
        ),
      ),
    ).toBe(true);
    expect(toValue(logicOr(() => 'foo'))).toBe(true);

    expect(toValue(logicOr(() => false))).toBe(false);
    expect(toValue(logicOr(() => ''))).toBe(false);
    expect(toValue(logicOr(() => 0))).toBe(false);
  });
});
