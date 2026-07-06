import { describe, expect, it, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { syncRefs } from './index';

describe('syncRefs', () => {
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    injector = createInjector();
  });

  it('should sync values by default', async () => {
    runInInjectionContext(injector, () => {
      const source = signal(42);
      const target1 = signal(0);
      const target2 = signal(0);
      const result = syncRefs(source, [target1, target2]);

      expect(target1()).toBe(42);
      expect(target2()).toBe(42);
      result();
    });
  });

  it('should handle multiple targets', async () => {
    runInInjectionContext(injector, () => {
      const source = signal<string>('hello');
      const target1 = signal<string>('');
      const target2 = signal<string>('');
      const result = syncRefs(source, [target1, target2]);

      expect(target1()).toBe('hello');
      expect(target2()).toBe('hello');
      result();
    });
  });

  it('should handle single target', async () => {
    runInInjectionContext(injector, () => {
      const source = signal<number>(100);
      const target = signal<number>(0);
      const result = syncRefs(source, target);

      expect(target()).toBe(100);
      result();
    });
  });

  it('should stop syncing after destroy', async () => {
    runInInjectionContext(injector, () => {
      const source = signal(1);
      const target = signal(0);
      const result = syncRefs(source, target);

      expect(target()).toBe(1);

      result();

      source.set(999);
      expect(target()).toBe(1);
    });
  });
});
