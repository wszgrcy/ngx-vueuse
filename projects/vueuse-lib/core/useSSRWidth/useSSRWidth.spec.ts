import { describe, expect, it } from 'vitest';
import { provideSSRWidth, useSSRWidth } from './index';

describe('useSSRWidth', () => {
  it('should be undefined by default', () => {
    expect(useSSRWidth()).toBeUndefined();
  });

  it('should provide the set value through global store', () => {
    provideSSRWidth(500);
    const ssrWidth = useSSRWidth();
    expect(ssrWidth).toBe(500);
  });

  it('should provide the set value through global store locally', () => {
    provideSSRWidth(700);
    const ssrWidth = useSSRWidth();
    expect(ssrWidth).toBe(700);
  });

  it('should handle null value', () => {
    provideSSRWidth(null);
    const ssrWidth = useSSRWidth();
    expect(ssrWidth).toBeUndefined();
  });
});
