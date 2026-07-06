import { describe, expect, it } from 'vitest';
import { refManualReset } from './refManualReset';

describe('refManualReset', () => {
  it('should be defined', () => {
    expect(refManualReset).toBeDefined();
  });

  it('should be default at first', () => {
    const val = refManualReset('default');
    expect(val()).toBe('default');
  });

  it('should be updated', () => {
    const val = refManualReset('default');

    (val as any).set('update');
    expect(val()).toBe('update');
  });

  it('should be reset', () => {
    const val = refManualReset('default');
    (val as any).set('update');

    val.reset();
    expect(val()).toBe('default');
  });
});
