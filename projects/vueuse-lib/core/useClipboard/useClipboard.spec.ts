import { describe, it, expect } from 'vitest';
import { useClipboard } from './index';

describe('useClipboard', () => {
  it('should be defined', () => {
    expect(useClipboard).toBeDefined();
  });

  it('should export a function', () => {
    expect(typeof useClipboard).toBe('function');
  });
});
