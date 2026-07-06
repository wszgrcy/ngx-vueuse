import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { refAutoReset, autoResetRef } from './refAutoReset';

describe('refAutoReset', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be defined', () => {
    expect(refAutoReset).toBeDefined();
    expect(autoResetRef).toBeDefined();
  });

  it('should be default at first', () => {
    const val = refAutoReset('default', 100);
    expect(val()).toBe('default');
  });

  it('should be updated', () => {
    const val = refAutoReset('default', 100);

    val.set('update');
    expect(val()).toBe('update');
  });

  it('should be reset', () => {
    const val = refAutoReset('default', 100);
    val.set('update');

    vi.advanceTimersByTime(101);
    expect(val()).toBe('default');
  });

  it('should be reset with maybeRef', () => {
    const val = refAutoReset(
      () => [123],
      () => 10,
    );
    val.set([999]);
    expect(val()).toEqual([999]);
    vi.advanceTimersByTime(11);
    expect(val()).toEqual([123]);
  });

  it('should change afterMs', () => {
    // Simulate reactive afterMs with a getter
    let afterMsValue = 150;
    const getAfterMs = () => afterMsValue;
    const val = refAutoReset('default', getAfterMs as any);
    val.set('update');
    afterMsValue = 100;

    vi.advanceTimersByTime(101);
    expect(val()).toBe('update');

    vi.advanceTimersByTime(50);
    expect(val()).toBe('default');

    val.set('update');

    vi.advanceTimersByTime(101);
    expect(val()).toBe('default');
  });

  it('should reset value after delay', () => {
    const s = refAutoReset(0, 100);

    expect(s()).toBe(0);

    s.set(5);
    expect(s()).toBe(5);

    // Advance time by less than delay
    vi.advanceTimersByTime(50);
    expect(s()).toBe(5);

    // Advance time past delay
    vi.advanceTimersByTime(60);
    expect(s()).toBe(0);
  });

  it('should clear timer on new value set', () => {
    const s = refAutoReset(0, 100);

    s.set(1);
    vi.advanceTimersByTime(50);

    s.set(2);
    vi.advanceTimersByTime(50);

    // Should still be 2 because timer was reset
    expect(s()).toBe(2);

    vi.advanceTimersByTime(60);
    expect(s()).toBe(0);
  });
});
