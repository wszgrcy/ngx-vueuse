import { describe, expect, it, beforeEach } from 'vitest';
import { runInInjectionContext, signal } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useSorted } from './index';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

interface User {
  name: string;
  age: number;
}

const arr = [10, 3, 5, 7, 2, 1, 8, 6, 9, 4];
const arrSorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const objArr: User[] = [
  {
    name: 'John',
    age: 40,
  },
  {
    name: 'Jane',
    age: 20,
  },
  {
    name: 'Joe',
    age: 30,
  },
  {
    name: 'Jenny',
    age: 22,
  },
];
const objectSorted: User[] = [
  {
    name: 'Jane',
    age: 20,
  },
  {
    name: 'Jenny',
    age: 22,
  },
  {
    name: 'Joe',
    age: 30,
  },
  {
    name: 'John',
    age: 40,
  },
];

describe('useSorted', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should be defined', () => {
    expect(useSorted).toBeDefined();
  });

  it('should pure sort function', () => {
    const sorted = runWithInjector(() => useSorted(arr));
    expect(sorted()).toMatchObject(arrSorted);
    expect(arr).toMatchObject([10, 3, 5, 7, 2, 1, 8, 6, 9, 4]);
  });

  it('should dirty sort', async () => {
    const dirtyArr = [...arr];
    const sorted = runWithInjector(() => useSorted(dirtyArr, (a, b) => a - b, { dirty: true }));
    await waitForMicrotasks();

    expect(sorted()).toMatchObject(arrSorted);
    expect(dirtyArr).toMatchObject(sorted());
  });

  it('should sort object', () => {
    const sorted = runWithInjector(() => useSorted(objArr, (a, b) => a.age - b.age));

    expect(sorted()).toMatchObject(objectSorted);
  });

  it('should sort object by options.compareFn', () => {
    const sorted = runWithInjector(() =>
      useSorted(objArr, {
        compareFn: (a, b) => a.age - b.age,
      }),
    );

    expect(sorted()).toMatchObject(objectSorted);
  });

  it('should work with signal', () => {
    const target = signal([...arr]);
    const sorted = runWithInjector(() => useSorted(target));

    expect(sorted()).toMatchObject(arrSorted);

    target.set([1, 2, 3]);
    expect(sorted()).toEqual([1, 2, 3]);
  });

  it('should work with custom comparator', () => {
    const sorted = runWithInjector(() => useSorted(arr, (a, b) => b - a));

    expect(sorted()).toMatchObject([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('should work with empty array', () => {
    const sorted = runWithInjector(() => useSorted([]));

    expect(sorted()).toEqual([]);
  });
});
