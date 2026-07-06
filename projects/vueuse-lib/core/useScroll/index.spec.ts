import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { useScroll } from './index';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';

let injector: ReturnType<typeof createInjector>;

describe('useScroll', () => {
  beforeEach(() => {
    injector = createInjector();
  });

  afterEach(() => {
    injector.destroy();
  });

  it('should be defined', () => {
    expect(useScroll).toBeDefined();
  });

  it('should have default x and y', () => {
    const { x, y } = runInInjectionContext(injector, () => useScroll(window));
    expect(x()).toBe(0);
    expect(y()).toBe(0);
  });
});
