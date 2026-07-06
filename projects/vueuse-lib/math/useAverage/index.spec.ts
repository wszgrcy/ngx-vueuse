import { describe, expect, it } from 'vitest';
import { useAverage } from './index';

describe('useAverage', () => {
  it('should be defined', () => {
    expect(useAverage).toBeDefined();
  });

  it('should return average from array', () => {
    const result = useAverage([1, 2, 3, 4, 5]);
    expect(result()).toBe(3);
  });

  it('should return average from multiple args', () => {
    const result = useAverage(1, 2, 3, 4, 5);
    expect(result()).toBe(3);
  });
});
