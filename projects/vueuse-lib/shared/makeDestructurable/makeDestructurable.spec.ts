import { describe, expect, it } from 'vitest';
import { makeDestructurable } from './makeDestructurable';

describe('makeDestructurable', () => {
  it('should make object destructurable with array', () => {
    const obj = { a: 1, b: 2 };
    const arr = [3, 4] as const;
    const result = makeDestructurable(obj, arr);

    // Test object property access
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);

    // Test array destructuring
    const [x, y] = result as any;
    expect(x).toBe(3);
    expect(y).toBe(4);
  });

  it('should work with empty array', () => {
    const obj = { a: 1 };
    const arr = [] as const;
    const result = makeDestructurable(obj, arr);

    expect(result.a).toBe(1);
  });

  it('should work with empty object', () => {
    const obj = {};
    const arr = [1, 2, 3] as const;
    const result = makeDestructurable(obj, arr);

    const [x, y, z] = result as any;
    expect(x).toBe(1);
    expect(y).toBe(2);
    expect(z).toBe(3);
  });
});
