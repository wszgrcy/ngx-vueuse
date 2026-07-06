import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useAnimate } from './index';

// Create a mock element with animate method
function createMockElement(): HTMLElement & { animate: any } {
  const mockAnimations: Map<number, any> = new Map();
  let animationId = 0;

  const mockElement = document.createElement('div') as HTMLElement & { animate: any };
  mockElement.animate = vi.fn((keyframes: Keyframe[], options?: KeyframeAnimationOptions) => {
    const id = ++animationId;
    const mockAnimation = {
      pending: false,
      playState: 'running' as AnimationPlayState,
      replaceState: 'active' as AnimationReplaceState,
      startTime: null as number | CSSNumberish | null,
      currentTime: 0 as number | CSSNumberish | null,
      timeline: null as AnimationTimeline | null,
      playbackRate: 1,
      effect: null as KeyframeEffect | null,
      play: () => {
        mockAnimation.playState = 'running';
        mockAnimation.pending = false;
      },
      pause: () => {
        mockAnimation.playState = 'paused';
      },
      reverse: () => {
        mockAnimation.playbackRate = -1;
        mockAnimation.playState = 'running';
      },
      finish: () => {
        mockAnimation.playState = 'finished';
        mockAnimation.pending = false;
      },
      cancel: () => {
        mockAnimation.playState = 'idle';
        mockAnimation.pending = false;
      },
      commitStyles: () => {},
      persist: () => {},
    };
    mockAnimations.set(id, mockAnimation);
    return mockAnimation as unknown as Animation;
  });

  return mockElement;
}

describe('useAnimate', () => {
  let injector: ReturnType<typeof createInjector>;
  let mockElement: HTMLElement & { animate: any };

  beforeEach(() => {
    injector = createInjector();
    mockElement = createMockElement();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(useAnimate).toBeDefined();
  });

  it('should return correct interface', () => {
    let result: ReturnType<typeof useAnimate> | undefined;

    runInInjectionContext(injector, () => {
      result = useAnimate(mockElement, { transform: 'rotate(360deg)' }, 100);
    });

    expect(result).toBeDefined();
    expect(result!.isSupported).toBeDefined();
    expect(result!.animate).toBeDefined();
    expect(result!.play).toBeDefined();
    expect(result!.pause).toBeDefined();
    expect(result!.reverse).toBeDefined();
    expect(result!.finish).toBeDefined();
    expect(result!.cancel).toBeDefined();
    expect(result!.pending).toBeDefined();
    expect(result!.playState).toBeDefined();
    expect(result!.replaceState).toBeDefined();
    expect(result!.startTime).toBeDefined();
    expect(result!.currentTime).toBeDefined();
    expect(result!.timeline).toBeDefined();
    expect(result!.playbackRate).toBeDefined();
  });

  it('should return undefined animate when element is null', () => {
    let result: ReturnType<typeof useAnimate> | undefined;

    runInInjectionContext(injector, () => {
      result = useAnimate(null as any, { transform: 'rotate(360deg)' }, 100);
    });

    expect(result!.animate()).toBe(undefined);
  });

  it('should handle signal element reference', () => {
    const elementSignal = signal(mockElement);
    let result: ReturnType<typeof useAnimate> | undefined;

    runInInjectionContext(injector, () => {
      result = useAnimate(elementSignal, { opacity: 1 }, 100);
    });

    expect(result).toBeDefined();
    expect(result!.animate).toBeDefined();
  });

  it('should handle getter element reference', () => {
    let result: ReturnType<typeof useAnimate> | undefined;

    runInInjectionContext(injector, () => {
      result = useAnimate(() => mockElement, { opacity: 1 }, 100);
    });

    expect(result).toBeDefined();
    expect(result!.animate).toBeDefined();
  });

  it('should have play, pause, reverse, finish, cancel functions', () => {
    let result: ReturnType<typeof useAnimate> | undefined;

    runInInjectionContext(injector, () => {
      result = useAnimate(mockElement, { opacity: 1 }, 100);
    });

    expect(typeof result!.play).toBe('function');
    expect(typeof result!.pause).toBe('function');
    expect(typeof result!.reverse).toBe('function');
    expect(typeof result!.finish).toBe('function');
    expect(typeof result!.cancel).toBe('function');
  });

  it('should return computed signals for state', async () => {
    let result: ReturnType<typeof useAnimate> | undefined;

    runInInjectionContext(injector, () => {
      result = useAnimate(mockElement, { opacity: 1 }, 100);
    });

    // Wait for afterNextRender to execute
    await Promise.resolve();

    expect(typeof result!.pending()).toBe('boolean');
    expect(result!.playState()).toBeDefined();
    expect(result!.replaceState()).toBeDefined();
    expect(result!.playbackRate()).toBe(1);
  });
});
