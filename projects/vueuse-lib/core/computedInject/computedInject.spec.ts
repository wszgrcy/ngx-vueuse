import { InjectionToken } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { computedInject } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

const KEY = new InjectionToken<number>('num');

describe('computedInject', () => {
  it('should be defined', () => {
    expect(computedInject).toBeDefined();
  });

  it('should be computed signal', () => {
    let result: number | undefined;
    const injector = createInjector();

    runInInjectionContext(injector, () => {
      const computedNum = computedInject(KEY, (source) => {
        if (source) return source + 1;
        return undefined as any;
      });
      result = computedNum();
    });

    expect(result).toBeUndefined();
  });
});
