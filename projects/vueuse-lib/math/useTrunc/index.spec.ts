import { describe, expect, it } from 'vitest';
import { useTrunc } from './index';

describe('useTrunc', () => {
  it('should be defined', () => {
    expect(useTrunc).toBeDefined();
  });

  it('should return truncated value', () => {
    const result = useTrunc(3.7);
    expect(result()).toBe(3);
  });

  it('should return same value for integer input', () => {
    const result = useTrunc(5);
    expect(result()).toBe(5);
  });
});
