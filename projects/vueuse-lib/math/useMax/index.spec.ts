import { describe, expect, it } from 'vitest';
import { useMax } from './index';

describe('useMax', () => {
  it('should be defined', () => {
    expect(useMax).toBeDefined();
  });

  it('should return maximum from array', () => {
    const result = useMax([1, 5, 3, 2]);
    expect(result()).toBe(5);
  });

  it('should return maximum from multiple args', () => {
    const result = useMax(1, 5, 3, 2);
    expect(result()).toBe(5);
  });
});
