import { describe, expect, it } from 'vitest';
import { useAbs } from './index';

describe('useAbs', () => {
  it('should be defined', () => {
    expect(useAbs).toBeDefined();
  });

  it('should return absolute value', () => {
    const result = useAbs(-5);
    expect(result()).toBe(5);
  });

  it('should return positive value as is', () => {
    const result = useAbs(5);
    expect(result()).toBe(5);
  });

  it('should return zero for zero input', () => {
    const result = useAbs(0);
    expect(result()).toBe(0);
  });
});
