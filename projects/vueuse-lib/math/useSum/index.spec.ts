import { describe, expect, it } from 'vitest';
import { useSum } from './index';

describe('useSum', () => {
  it('should be defined', () => {
    expect(useSum).toBeDefined();
  });

  it('should return sum from array', () => {
    const result = useSum([1, 2, 3, 4]);
    expect(result()).toBe(10);
  });

  it('should return sum from multiple args', () => {
    const result = useSum(1, 2, 3, 4);
    expect(result()).toBe(10);
  });
});
