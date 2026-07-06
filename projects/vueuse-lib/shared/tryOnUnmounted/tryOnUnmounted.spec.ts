import { describe, expect, it, vi } from 'vitest';
import { tryOnUnmounted } from './tryOnUnmounted';

describe('tryOnUnmounted', () => {
  it('should do nothing when not in injection context', () => {
    const fn = vi.fn();
    tryOnUnmounted(fn);
    // Should not throw and not call the function
    expect(fn).not.toHaveBeenCalled();
  });
});
