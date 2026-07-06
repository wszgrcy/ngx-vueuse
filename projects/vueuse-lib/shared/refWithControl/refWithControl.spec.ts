import { describe, expect, it, vi } from 'vitest';
import { refWithControl } from './refWithControl';

describe('refWithControl', () => {
  it('should create a controlled ref', () => {
    const ref = refWithControl(0);

    expect(ref()).toBe(0);

    ref.set(5);
    expect(ref.peek()).toBe(5);
  });

  it('should call onBeforeChange callback', () => {
    const onBeforeChange = vi.fn(() => true);
    const ref = refWithControl(0, { onBeforeChange });

    ref.set(5);
    expect(onBeforeChange).toHaveBeenCalledWith(5, 0);
  });

  it('should dismiss change when onBeforeChange returns false', () => {
    const onBeforeChange = vi.fn(() => false);
    const ref = refWithControl(0, { onBeforeChange });

    ref.set(5);
    expect(ref()).toBe(0);
  });

  it('should call onChanged callback', () => {
    const onChanged = vi.fn();
    const ref = refWithControl(0, { onChanged });

    ref.set(5);
    expect(onChanged).toHaveBeenCalledWith(5, 0);
  });

  it('should provide untrackedGet and peek', () => {
    const ref = refWithControl(0);

    expect(ref.untrackedGet()).toBe(0);
    expect(ref.peek()).toBe(0);
  });

  it('should provide silentSet and lay', () => {
    const onChanged = vi.fn();
    const ref = refWithControl(0, { onChanged });

    ref.silentSet(5);
    expect(onChanged).not.toHaveBeenCalled();
    expect(ref.peek()).toBe(5);
  });
});
