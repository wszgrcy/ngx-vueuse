import { describe, expect, it } from 'vitest';
import { useRound } from './index';

describe('useRound', () => {
  it('should be defined', () => {
    expect(useRound).toBeDefined();
  });

  it('should return rounded value', () => {
    const result = useRound(3.5);
    expect(result()).toBe(4);
  });

  it('should return same value for integer input', () => {
    const result = useRound(5);
    expect(result()).toBe(5);
  });
});
