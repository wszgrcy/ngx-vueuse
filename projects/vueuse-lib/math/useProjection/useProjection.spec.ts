import { describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { useProjection } from './index';

describe('useProjection', () => {
  it('should be defined', () => {
    expect(useProjection).toBeDefined();
  });

  it('returns a signal', () => {
    const result = useProjection(signal(5), [0, 10], [0, 100]);
    expect(typeof result()).toBe('number');
  });

  it('projects correctly', () => {
    expect(useProjection(5, [0, 10], [0, 100])()).toBe(50);
    expect(useProjection(3, [0, 10], [0, 100])()).toBe(30);
    expect(useProjection(4, [0, 44], [0, 132])()).toBe(12);
  });

  it('is reactive', () => {
    const inputSignal = signal(5);
    const projection = useProjection(inputSignal, [0, 10], [0, 100]);

    expect(projection()).toBe(50);

    inputSignal.set(8);
    expect(projection()).toBe(80);

    inputSignal.set(2.3);
    expect(projection()).toBe(23);
  });

  it('works with getter functions', () => {
    const input1 = signal(5);
    const input2 = signal(3);
    const input3 = signal(4);
    expect(useProjection(input1, [0, 10], [0, 100])()).toBe(50);
    expect(useProjection(input2, [0, 10], [0, 100])()).toBe(30);
    expect(useProjection(input3, [0, 44], [0, 132])()).toBe(12);
  });
});
