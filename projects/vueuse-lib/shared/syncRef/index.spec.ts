import { describe, expect, it, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { syncRef } from './index';

describe('syncRef', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should create a destroy function', () => {
    runInInjectionContext(injector, () => {
      const left = signal(1);
      const right = signal(2);
      const destroy = syncRef(left, right);

      expect(typeof destroy).toBe('function');
    });
  });

  it('should sync values bidirectionally (both direction)', async () => {
    runInInjectionContext(injector, () => {
      const left = signal('foo');
      const right = signal('bar');
      const result = syncRef(left, right);

      // Immediate sync: right gets left's value (synchronous)
      expect(right()).toBe('foo');

      result();
    });
  });

  it('should sync only rtl direction', async () => {
    runInInjectionContext(injector, () => {
      const left = signal('left');
      const right = signal('right');
      const result = syncRef(left, right, { direction: 'rtl' });

      // Initial sync: left gets right's value (synchronous)
      expect(left()).toBe('right');
      expect(right()).toBe('right');

      result();
    });
  });

  it('should apply ltr transform', async () => {
    runInInjectionContext(injector, () => {
      const left = signal(10);
      const right = signal(2);
      const result = syncRef(left, right, {
        transform: {
          ltr: (v) => v * 2,
          rtl: (v) => Math.floor(v / 3),
        },
      });

      // Immediate sync: right = left * 2 = 20, then left = right / 3 = 6
      expect(right()).toBe(20);
      expect(left()).toBe(6);

      result();
    });
  });

  it('should apply only rtl transform', async () => {
    runInInjectionContext(injector, () => {
      const left = signal(10);
      const right = signal(2);
      const result = syncRef(left, right, {
        direction: 'rtl',
        transform: {
          rtl: (v) => Math.round(v / 2),
        },
      });

      // Initial sync: left = round(right / 2) = 1
      expect(left()).toBe(1);
      expect(right()).toBe(2);

      result();
    });
  });

  it('should stop syncing after destroy', async () => {
    runInInjectionContext(injector, () => {
      const left = signal('foo');
      const right = signal('bar');
      const result = syncRef(left, right);

      expect(right()).toBe('foo');

      result();

      left.set('after-destroy');
      expect(right()).toBe('foo');
    });
  });

  it('should handle different types', async () => {
    runInInjectionContext(injector, () => {
      const left = signal<string>('a');
      const right = signal<string>('b');
      const result = syncRef(left, right);

      expect(right()).toBe('a');
      result();
    });
  });

  // === 补充的测试用例 (原版 VueUse 测试场景) ===

  it('should sync different types with transform (number | string)', async () => {
    runInInjectionContext(injector, () => {
      const left = signal(0);
      const right = signal('1');

      const stop = syncRef(left, right, {
        direction: 'both',
        transform: {
          ltr: (v: number) => v.toString(),
          rtl: (v: string) => Number(v),
        },
      });

      // left=0 -> right='0'
      expect(right()).toBe('0');
      // right was '1' -> left=Math.round(1/2)=0
      expect(left()).toBe(0);

      left.set(5);
      // 需要等待 effect 执行
      setTimeout(() => {
        expect(right()).toBe('5');
        stop();
      }, 10);
    });
  });

  it('should sync boundary values (0, empty string, false)', async () => {
    runInInjectionContext(injector, () => {
      const left = signal(0);
      const right = signal('');

      const stop = syncRef(left, right, {
        direction: 'ltr',
        transform: {
          ltr: (v: number) => v.toString(),
        },
      });

      // 0 是 falsy 值，但仍然应该同步
      expect(right()).toBe('0');

      stop();
    });
  });
});
