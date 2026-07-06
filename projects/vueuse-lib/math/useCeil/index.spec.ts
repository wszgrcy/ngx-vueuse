import { describe, expect, it } from 'vitest';
import { useCeil } from './index';

describe('useCeil', () => {
  it('should be defined', () => {
    expect(useCeil).toBeDefined();
  });

  it('should return ceiling value', () => {
    const result = useCeil(3.2);
    expect(result()).toBe(4);
  });

  it('should return same value for integer input', () => {
    const result = useCeil(5);
    expect(result()).toBe(5);
  });
});
