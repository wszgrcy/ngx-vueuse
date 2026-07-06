import { describe, expect, it } from 'vitest';
import { useFloor } from './index';

describe('useFloor', () => {
  it('should be defined', () => {
    expect(useFloor).toBeDefined();
  });

  it('should return floor value', () => {
    const result = useFloor(3.8);
    expect(result()).toBe(3);
  });

  it('should return same value for integer input', () => {
    const result = useFloor(5);
    expect(result()).toBe(5);
  });
});
