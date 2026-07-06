import { describe, expect, it, vi } from 'vitest';
import { tryOnMounted } from './tryOnMounted';

describe('tryOnMounted', () => {
  it('should call function synchronously when not in injection context', () => {
    const fn = vi.fn();
    tryOnMounted(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call function asynchronously when sync is false', () => {
    const fn = vi.fn();
    tryOnMounted(fn, false);
    expect(fn).not.toHaveBeenCalled();

    return Promise.resolve().then(() => {
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
