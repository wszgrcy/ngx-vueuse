import { describe, expect, it } from 'vitest';
import { useMin } from './index';

describe('useMin', () => {
  it('should be defined', () => {
    expect(useMin).toBeDefined();
  });

  it('should return minimum from array', () => {
    const result = useMin([1, 5, 3, 2]);
    expect(result()).toBe(1);
  });

  it('should return minimum from multiple args', () => {
    const result = useMin(1, 5, 3, 2);
    expect(result()).toBe(1);
  });
});
