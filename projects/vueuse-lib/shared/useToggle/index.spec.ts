import { describe, expect, it } from 'vitest';
import { signal, isSignal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { useToggle } from './index';
import type { ToggleFn } from './index';

describe('useToggle', () => {
  it('should be defined', () => {
    expect(useToggle).toBeDefined();
  });

  it('default result', () => {
    const result = useToggle() as [WritableSignal<boolean>, ToggleFn];
    const [value, toggle] = result;

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    expect(typeof toggle).toBe('function');
    expect(isSignal(value)).toBe(true);
    expect(value()).toBe(false);
  });

  it('default result with initialValue', () => {
    const result = useToggle(true) as [WritableSignal<boolean>, ToggleFn];
    const [value, toggle] = result;

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);

    expect(typeof toggle).toBe('function');
    expect(isSignal(value)).toBe(true);
    expect(value()).toBe(true);
  });

  it('should toggle', () => {
    const result = useToggle() as [WritableSignal<boolean>, ToggleFn];
    const [value, toggle] = result;

    expect(toggle()).toBe(true);
    expect(value()).toBe(true);

    expect(toggle()).toBe(false);
    expect(value()).toBe(false);
  });

  it('should receive toggle param', () => {
    const result = useToggle(false) as [WritableSignal<boolean>, ToggleFn];
    const [value, toggle] = result;

    expect(toggle(true)).toBe(true);
    expect(value()).toBe(true);

    expect(toggle(false)).toBe(false);
    expect(value()).toBe(false);
  });

  it('should toggle with truthy & falsy values', () => {
    const result = useToggle('ON' as 'ON' | 'OFF', {
      truthyValue: 'ON',
      falsyValue: 'OFF',
    }) as [WritableSignal<'ON' | 'OFF'>, ToggleFn<'ON', 'OFF'>];
    const [value, toggle] = result;

    expect(value()).toBe('ON');
    expect(toggle()).toBe('OFF'); // toggles from ON to OFF
    expect(isSignal(value)).toBe(true);
  });

  it('should handle signal initial value', () => {
    const isDark = signal(true);
    const toggle = useToggle(isDark);

    expect(typeof toggle).toBe('function');

    expect(toggle()).toBe(false);
    expect(isDark()).toBe(false);

    expect(toggle()).toBe(true);
    expect(isDark()).toBe(true);

    expect(toggle(false)).toBe(false);
    expect(isDark()).toBe(false);

    expect(toggle(true)).toBe(true);
    expect(isDark()).toBe(true);
  });

  it('should toggle with truthy & falsy values using signal', () => {
    const status = signal('ON' as 'ON' | 'OFF');
    const toggle = useToggle(status, {
      truthyValue: 'ON',
      falsyValue: 'OFF',
    });

    expect(typeof toggle).toBe('function');
    expect(status()).toBe('ON');

    expect(toggle()).toBe('OFF');
    expect(status()).toBe('OFF');

    expect(toggle()).toBe('ON');
    expect(status()).toBe('ON');

    expect(toggle('OFF')).toBe('OFF');
    expect(status()).toBe('OFF');

    expect(toggle('ON')).toBe('ON');
    expect(status()).toBe('ON');
  });
});
