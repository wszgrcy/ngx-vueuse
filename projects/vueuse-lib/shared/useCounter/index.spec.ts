import { describe, expect, it } from 'vitest';
import { useCounter } from './index';

describe('useCounter', () => {
  it('should be defined', () => {
    expect(useCounter).toBeDefined();
  });

  it('should update counter', () => {
    const { count, inc, dec, get, set, reset } = useCounter();

    expect(count()).toBe(0);
    expect(get()).toBe(0);
    inc();
    expect(count()).toBe(1);
    expect(get()).toBe(1);
    inc(2);
    expect(count()).toBe(3);
    expect(get()).toBe(3);
    inc(-1);
    expect(count()).toBe(2);
    expect(get()).toBe(2);
    dec();
    expect(count()).toBe(1);
    expect(get()).toBe(1);
    dec(5);
    expect(count()).toBe(-4);
    expect(get()).toBe(-4);
    dec(-1);
    expect(count()).toBe(-3);
    expect(get()).toBe(-3);
    set(100);
    expect(count()).toBe(100);
    expect(get()).toBe(100);
    reset();
    expect(count()).toBe(0);
    expect(get()).toBe(0);
    reset(25);
    expect(count()).toBe(25);
    expect(get()).toBe(25);
    reset();
    expect(count()).toBe(25);
    expect(get()).toBe(25);
  });

  it('should update with min/max limits', () => {
    const { count, inc, dec } = useCounter(50, { min: 0, max: 100 });

    expect(count()).toBe(50);
    inc(100);
    expect(count()).toBe(100); // capped at max
    dec(200);
    expect(count()).toBe(0); // capped at min
    inc();
    expect(count()).toBe(1);
    dec();
    expect(count()).toBe(0);
  });

  it('should update limited counter', () => {
    const { count, inc, dec, get, set, reset } = useCounter(1, { min: -2, max: 15 });

    expect(count()).toBe(1);
    expect(get()).toBe(1);
    inc(20);
    expect(count()).toBe(15);
    expect(get()).toBe(15);
    inc(-20);
    expect(count()).toBe(-2);
    expect(get()).toBe(-2);
    dec(-20);
    expect(count()).toBe(15);
    expect(get()).toBe(15);
    dec(2);
    expect(count()).toBe(13);
    expect(get()).toBe(13);
    dec();
    expect(count()).toBe(12);
    expect(get()).toBe(12);
    dec(20);
    expect(count()).toBe(-2);
    expect(get()).toBe(-2);
    reset();
    expect(count()).toBe(1);
    expect(get()).toBe(1);
    set(20);
    expect(count()).toBe(15);
    expect(get()).toBe(15);
    set(-10);
    expect(count()).toBe(-2);
    expect(get()).toBe(-2);
    reset();
    expect(count()).toBe(1);
    expect(get()).toBe(1);
    reset(20);
    expect(count()).toBe(15);
    expect(get()).toBe(15);
    reset(-10);
    expect(count()).toBe(-2);
    expect(get()).toBe(-2);
  });

  it('should accept initial value', () => {
    const { count, inc, get } = useCounter(10);

    expect(count()).toBe(10);
    expect(get()).toBe(10);
    inc();
    expect(count()).toBe(11);
    expect(get()).toBe(11);
  });

  it('should be update initial & counter', () => {
    const initial = 0;
    const { count, inc, dec, get, set, reset } = useCounter(initial);

    expect(count()).toBe(0);
    expect(get()).toBe(0);
    inc();
    expect(count()).toBe(1);
    expect(get()).toBe(1);
    inc(2);
    expect(count()).toBe(3);
    expect(get()).toBe(3);
    dec();
    expect(count()).toBe(2);
    expect(get()).toBe(2);
    dec(5);
    expect(count()).toBe(-3);
    expect(get()).toBe(-3);
    set(100);
    expect(count()).toBe(100);
    expect(get()).toBe(100);
    reset();
    expect(count()).toBe(0);
    expect(get()).toBe(0);
    reset(25);
    expect(count()).toBe(25);
    expect(get()).toBe(25);
    reset();
    expect(count()).toBe(25); // reset() without arg doesn't change
    expect(get()).toBe(25);
  });
});
