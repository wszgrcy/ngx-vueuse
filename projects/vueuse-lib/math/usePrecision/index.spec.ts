import { describe, expect, it } from 'vitest';
import { usePrecision } from './index';

describe('usePrecision', () => {
  it('should be defined', () => {
    expect(usePrecision).toBeDefined();
  });

  it('should round to specified digits', () => {
    const result = usePrecision(3.14159, 2);
    expect(result()).toBe(3.14);
  });

  it('should round with custom math method', () => {
    const result = usePrecision(3.14159, 2, { math: 'ceil' });
    expect(result()).toBe(3.15);
  });
});
