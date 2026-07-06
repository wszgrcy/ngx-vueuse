import { describe, expect, it, vi, beforeEach } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useElementVisibility } from './index';

describe('useElementVisibility', () => {
  let el: HTMLDivElement;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    el = document.createElement('div');
    injector = createInjector();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should work when el is not an element', () => {
    const visible = runWithInjector(() => useElementVisibility(null));
    expect(visible()).toBeFalsy();
  });

  it('should work when window is undefined', () => {
    const visible = runWithInjector(() =>
      useElementVisibility(el, { window: null as unknown as Window }),
    );
    expect(visible()).toBeFalsy();
  });

  it('should work when threshold is undefined', () => {
    const visible = runWithInjector(() =>
      useElementVisibility(el, { threshold: null as unknown as number }),
    );
    expect(visible()).toBeFalsy();
  });

  it('should allow set initial value', () => {
    const visible = runWithInjector(() => useElementVisibility(el, { initialValue: true }));
    expect(visible()).toBeTruthy();
  });
  // vi.mock 不支持,所以下面的测试用例无法工作
  describe.skip('when internally using useIntersectionObserver', () => {
    beforeAll(() => {
      vi.resetAllMocks();
      //   vi.mock('../useIntersectionObserver', () => ({
      //     useIntersectionObserver: vi.fn((_target: any) => {
      //       const stop = vi.fn();
      //       return { stop };
      //     }),
      //   }));
    });

    let useIntersectionObserver: ReturnType<typeof vi.fn>;
    beforeEach(async () => {
      const mod = await import('../useIntersectionObserver');
      useIntersectionObserver = mod.useIntersectionObserver as ReturnType<typeof vi.fn>;
    });

    it('should call useIntersectionObserver internally', () => {
      expect(useIntersectionObserver).toHaveBeenCalledTimes(0);
      runWithInjector(() => useElementVisibility(el));
      expect(useIntersectionObserver).toHaveBeenCalledTimes(1);
    });

    it('passes the given element to useIntersectionObserver', () => {
      runWithInjector(() => useElementVisibility(el));
      expect(vi.mocked(useIntersectionObserver).mock.lastCall?.[0]).toBe(el);
    });

    it('passes a callback to useIntersectionObserver that sets visibility to false only when isIntersecting is false', () => {
      const isVisible = runWithInjector(() => useElementVisibility(el));
      const callback = vi.mocked(useIntersectionObserver).mock.lastCall?.[1];
      const callMockCallbackWithIsIntersectingValue = (isIntersecting: boolean) =>
        callback?.(
          [{ isIntersecting, time: 1 } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );

      // It should be false initially
      expect(isVisible()).toBe(false);

      // It should still be false if the callback doesn't get an isIntersecting = true
      callMockCallbackWithIsIntersectingValue(false);
      expect(isVisible()).toBe(false);

      // But it should become true if the callback gets an isIntersecting = true
      callMockCallbackWithIsIntersectingValue(true);
      expect(isVisible()).toBe(true);

      // And it should become false again if isIntersecting = false
      callMockCallbackWithIsIntersectingValue(false);
      expect(isVisible()).toBe(false);
    });

    it('should control visibility observer', () => {
      const visibilityState = runWithInjector(() => useElementVisibility(el, { controls: true }));
      const callback = vi.mocked(useIntersectionObserver).mock.lastCall?.[1];
      const callMockCallbackWithIsIntersectingValue = (isIntersecting: boolean) =>
        callback?.(
          [{ isIntersecting, time: 1 } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );

      // It should be false initially
      expect(visibilityState.isVisible()).toBe(false);

      // It should become true if the callback gets an isIntersecting = true
      callMockCallbackWithIsIntersectingValue(true);
      expect(visibilityState.isVisible()).toBe(true);
    });

    it('uses the latest version of isIntersecting when multiple intersection entries are given', () => {
      const isVisible = runWithInjector(() => useElementVisibility(el));
      const callback = vi.mocked(useIntersectionObserver).mock.lastCall?.[1];
      const callMockCallbackWithIsIntersectingValues = (
        ...entries: { isIntersecting: boolean; time: number }[]
      ) => {
        callback?.(entries as IntersectionObserverEntry[], {} as IntersectionObserver);
      };

      // It should be false initially
      expect(isVisible()).toBe(false);

      // It should take the latest value of isIntersecting
      callMockCallbackWithIsIntersectingValues(
        { isIntersecting: false, time: 1 },
        { isIntersecting: false, time: 2 },
        { isIntersecting: true, time: 3 },
      );
      expect(isVisible()).toBe(true);

      // It should take the latest even when entries are out of order
      callMockCallbackWithIsIntersectingValues(
        { isIntersecting: true, time: 1 },
        { isIntersecting: false, time: 3 },
        { isIntersecting: true, time: 2 },
      );

      expect(isVisible()).toBe(false);
    });

    it('passes the given window to useIntersectionObserver', () => {
      const mockWindow = {} as Window;

      runWithInjector(() => useElementVisibility(el, { window: mockWindow }));
      expect(vi.mocked(useIntersectionObserver).mock.lastCall?.[2]?.window).toBe(mockWindow);
    });

    it('uses the given scrollTarget as the root element in useIntersectionObserver', () => {
      const mockScrollTarget = document.createElement('div');

      runWithInjector(() => useElementVisibility(el, { scrollTarget: mockScrollTarget }));
      expect(vi.mocked(useIntersectionObserver).mock.lastCall?.[2]?.root).toBe(mockScrollTarget);
    });
  });
});
