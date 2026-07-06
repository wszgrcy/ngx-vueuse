import { describe, expect, it } from 'vitest';
import { signal, computed } from '@angular/core';
import { createProjection } from './index';

describe('createProjection', () => {
  it('should be defined', () => {
    expect(createProjection).toBeDefined();
  });

  it('should work with projector', () => {
    const fromStart = signal(0);
    const fromEnd = signal(10);
    const toRange = computed(() => [50, 100] as [number, number]);

    const useProjector = createProjection(
      computed(() => [fromStart(), fromEnd()] as [number, number]),
      toRange,
    );
    const input = signal(0);
    const output = useProjector(input);

    expect(output()).toBe(50);

    input.set(10);
    expect(output()).toBe(100);

    input.set(5);
    expect(output()).toBe(75);

    input.set(1);
    expect(output()).toBe(55);

    fromEnd.set(20);
    expect(output()).toBe(52.5);

    // Note: toRange is a computed, need to update it
    // In Angular, we would need to recreate or use a writable signal
  });
});
