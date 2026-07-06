import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { logicAnd } from './index';
import { toValue } from '@cyia/ngx-vueuse/shared';

describe('logicAnd', () => {
  it('should be defined', () => {
    expect(logicAnd).toBeDefined();
  });

  it('returns true when given no args', () => {
    expect(toValue(logicAnd())).toBe(true);
  });

  it('returns true only when all arguments are truthy', () => {
    expect(toValue(logicAnd(signal(true), signal(true)))).toBe(true);
    expect(toValue(logicAnd(signal('foo'), signal(true)))).toBe(true);
    expect(toValue(logicAnd(signal('foo'), signal(1)))).toBe(true);

    expect(toValue(logicAnd(signal(true), signal(false)))).toBe(false);
    expect(toValue(logicAnd(signal('foo'), signal(0)))).toBe(false);
  });

  it('works with values', () => {
    expect(toValue(logicAnd(true))).toBe(true);
    expect(toValue(logicAnd('foo'))).toBe(true);

    expect(toValue(logicAnd(true, false))).toBe(false);
    expect(toValue(logicAnd(0))).toBe(false);
  });

  it('works with getter functions', () => {
    expect(toValue(logicAnd(() => true))).toBe(true);
    expect(toValue(logicAnd(() => 'foo'))).toBe(true);

    expect(
      toValue(
        logicAnd(
          () => true,
          () => false,
        ),
      ),
    ).toBe(false);
    expect(toValue(logicAnd(() => 0))).toBe(false);
  });
});
