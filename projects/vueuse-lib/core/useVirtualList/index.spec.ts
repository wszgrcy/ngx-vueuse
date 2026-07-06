import { describe, expect, it } from 'vitest';
import { signal, runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useVirtualList } from './index';

describe('useVirtualList', () => {
  const injector = createInjector();

  it('should return an object with list, scrollTo, containerProps, and wrapperProps', () => {
    runInInjectionContext(injector, () => {
      const data = ['a', 'b', 'c', 'd', 'e'];
      const virtualList = useVirtualList(signal(data), { itemHeight: 50 });

      expect(virtualList.list).toBeDefined();
      expect(virtualList.scrollTo).toBeDefined();
      expect(virtualList.containerProps).toBeDefined();
      expect(virtualList.wrapperProps).toBeDefined();
    });
  });

  it('should return an empty list initially', () => {
    runInInjectionContext(injector, () => {
      const data = ['a', 'b', 'c', 'd', 'e'];
      const virtualList = useVirtualList(signal(data), { itemHeight: 50 });

      expect(virtualList.list()).toEqual([]);
    });
  });

  it('should support horizontal mode with itemWidth', () => {
    runInInjectionContext(injector, () => {
      const data = ['a', 'b', 'c', 'd', 'e'];
      const virtualList = useVirtualList(signal(data), { itemWidth: 100 });

      expect(virtualList.list).toBeDefined();
      expect(virtualList.scrollTo).toBeDefined();
      expect(virtualList.containerProps).toBeDefined();
      expect(virtualList.wrapperProps).toBeDefined();
    });
  });

  it('should return containerProps with onScroll and style', () => {
    runInInjectionContext(injector, () => {
      const data = ['a', 'b', 'c'];
      const virtualList = useVirtualList(signal(data), { itemHeight: 30 });

      expect(virtualList.containerProps.onScroll).toBeDefined();
      expect(virtualList.containerProps.style).toBeDefined();
    });
  });

  it('should accept signal as list input', () => {
    runInInjectionContext(injector, () => {
      const data = ['x', 'y', 'z'];
      const listSignal = signal(data);
      const virtualList = useVirtualList(listSignal, { itemHeight: 40 });

      expect(virtualList.list).toBeDefined();
    });
  });

  it('should accept plain array as list input', () => {
    runInInjectionContext(injector, () => {
      const data = ['p', 'q', 'r'];
      const virtualList = useVirtualList(data, { itemHeight: 25 });

      expect(virtualList.list).toBeDefined();
    });
  });

  it('should return wrapperProps with computed style', () => {
    runInInjectionContext(injector, () => {
      const data = Array.from({ length: 100 }, (_, i) => `item-${i}`);
      const virtualList = useVirtualList(signal(data), { itemHeight: 50 });

      const wrapperProps = virtualList.wrapperProps();
      expect(wrapperProps.style).toBeDefined();
      expect(wrapperProps.style.height).toBeDefined();
      expect((wrapperProps.style as any).marginTop).toBeDefined();
    });
  });

  it('should support overscan option', () => {
    runInInjectionContext(injector, () => {
      const data = ['a', 'b', 'c'];
      const virtualList = useVirtualList(signal(data), { itemHeight: 50, overscan: 10 });

      expect(virtualList.list).toBeDefined();
    });
  });

  it('should return scrollTo function', () => {
    runInInjectionContext(injector, () => {
      const data = ['a', 'b', 'c'];
      const virtualList = useVirtualList(signal(data), { itemHeight: 50 });

      expect(typeof virtualList.scrollTo).toBe('function');
    });
  });

  it('should handle empty list', () => {
    runInInjectionContext(injector, () => {
      const virtualList = useVirtualList(signal([]), { itemHeight: 50 });

      expect(virtualList.list()).toEqual([]);
      expect(virtualList.wrapperProps().style.height).toBeDefined();
    });
  });

  it('should handle vertical list with large data', () => {
    runInInjectionContext(injector, () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }));
      const virtualList = useVirtualList(signal(data), { itemHeight: 30 });

      expect(virtualList.list).toBeDefined();
      expect(virtualList.scrollTo).toBeDefined();
    });
  });

  it('should handle horizontal list with large data', () => {
    runInInjectionContext(injector, () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }));
      const virtualList = useVirtualList(signal(data), { itemWidth: 200 });

      expect(virtualList.list).toBeDefined();
      expect(virtualList.scrollTo).toBeDefined();
    });
  });
});
