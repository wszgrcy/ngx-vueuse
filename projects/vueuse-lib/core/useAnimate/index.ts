import type { Signal } from '@angular/core';
import { computed, effect, signal } from '@angular/core';
import type { SignalOrGetter } from '@cyia/ngx-vueuse/shared';
import type { ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import type { MaybeComputedElementRef } from '../unrefElement';
import { isObject } from '@cyia/ngx-vueuse/shared';
import { objectOmit, toValue } from '@cyia/ngx-vueuse/shared';
import { defaultWindow } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';
import { useRafFn } from '../useRafFn';
import { useSupported } from '../useSupported';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';

export interface UseAnimateOptions extends KeyframeAnimationOptions, ConfigurableWindow {
  /**
   * Will automatically run play when `useAnimate` is used
   *
   * @default true
   */
  immediate?: boolean;
  /**
   * Whether to commits the end styling state of an animation to the element being animated
   * In general, you should use `fill` option with this.
   *
   * @default false
   */
  commitStyles?: boolean;
  /**
   * Whether to persists the animation
   *
   * @default false
   */
  persist?: boolean;
  /**
   * Executed after animation initialization
   */
  onReady?: (animate: Animation) => void;
  /**
   * Callback when error is caught.
   */
  onError?: (e: unknown) => void;
}

export type UseAnimateKeyframes = SignalOrGetter<
  Keyframe[] | PropertyIndexedKeyframes | null | undefined
>;

export interface UseAnimateReturn extends Supportable {
  animate: Signal<Animation | undefined>;
  play: () => void;
  pause: () => void;
  reverse: () => void;
  finish: () => void;
  cancel: () => void;

  pending: Signal<boolean>;
  playState: Signal<AnimationPlayState>;
  replaceState: Signal<AnimationReplaceState>;
  startTime: Signal<CSSNumberish | number | null>;
  currentTime: Signal<CSSNumberish | null>;
  timeline: Signal<AnimationTimeline | null>;
  playbackRate: Signal<number>;
}

type AnimateStoreKeys = Extract<
  keyof Animation,
  | 'startTime'
  | 'currentTime'
  | 'timeline'
  | 'playbackRate'
  | 'pending'
  | 'playState'
  | 'replaceState'
>;

interface AnimateStore {
  startTime: number | CSSNumberish | null;
  currentTime: number | CSSNumberish | null;
  timeline: AnimationTimeline | null;
  playbackRate: number;
  pending: boolean;
  playState: AnimationPlayState;
  replaceState: AnimationReplaceState;
}

/**
 * Reactive Web Animations API
 *
 * @see https://vueuse.org/useAnimate
 * @param target
 * @param keyframes
 * @param options
 */
export function useAnimate(
  target: MaybeComputedElementRef,
  keyframes: UseAnimateKeyframes,
  options?: number | UseAnimateOptions,
): UseAnimateReturn {
  let config: UseAnimateOptions;
  let animateOptions: undefined | number | KeyframeAnimationOptions;

  if (isObject(options)) {
    config = options;
    animateOptions = objectOmit(options, [
      'window',
      'immediate',
      'commitStyles',
      'persist',
      'onReady',
      'onError',
    ]) as KeyframeAnimationOptions;
  } else {
    config = { duration: options };
    animateOptions = options;
  }

  const {
    window = defaultWindow,
    immediate = true,
    commitStyles,
    persist,
    playbackRate: _playbackRate = 1,
    onReady,
    onError = (e: unknown) => {
      console.error(e);
    },
  } = config;

  const isSupported = useSupported(
    () => window && typeof HTMLElement !== 'undefined' && 'animate' in HTMLElement.prototype,
  );

  const animate = signal<Animation | undefined>(undefined);
  const store: AnimateStore = {
    startTime: null,
    currentTime: null,
    timeline: null,
    playbackRate: _playbackRate,
    pending: false,
    playState: immediate ? 'idle' : 'paused',
    replaceState: 'active',
  };

  const pending = computed(() => store.pending);
  const playState = computed(() => store.playState);
  const replaceState = computed(() => store.replaceState);

  // Writable signals equivalent to Vue WritableComputedRef
  const startTime = signal<CSSNumberish | number | null>(store.startTime);
  const currentTime = signal<number | CSSNumberish | null>(store.currentTime);
  const timeline = signal<AnimationTimeline | null>(store.timeline);
  const playbackRate = signal<number>(store.playbackRate);

  // Sync signal writes back to store and animation
  effect(() => {
    const value = startTime();
    store.startTime = value;
    const anim = animate();
    if (anim) anim.startTime = value;
  });

  effect(() => {
    const value = currentTime();
    store.currentTime = value;
    const anim = animate();
    if (anim) {
      anim.currentTime = value;
      syncResume();
    }
  });

  effect(() => {
    const value = timeline();
    store.timeline = value;
    const anim = animate();
    if (anim) anim.timeline = value;
  });

  effect(() => {
    const value = playbackRate();
    store.playbackRate = value;
    const anim = animate();
    if (anim) anim.playbackRate = value;
  });

  const play = () => {
    const anim = animate();
    if (anim) {
      try {
        anim.play();
        syncResume();
      } catch (e) {
        syncPause();
        onError(e);
      }
    } else {
      update();
    }
  };

  const pause = () => {
    const anim = animate();
    try {
      anim?.pause();
      syncPause();
    } catch (e) {
      onError(e);
    }
  };

  const reverse = () => {
    const anim = animate();
    if (!anim) update();
    try {
      anim?.reverse();
      syncResume();
    } catch (e) {
      syncPause();
      onError(e);
    }
  };

  const finish = () => {
    const anim = animate();
    try {
      anim?.finish();
      syncPause();
    } catch (e) {
      onError(e);
    }
  };

  const cancel = () => {
    const anim = animate();
    try {
      anim?.cancel();
      syncPause();
    } catch (e) {
      onError(e);
    }
  };

  // Watch target element changes (equivalent to Vue watch)
  const targetElSignal = computed(() => unrefElement(target));
  effect(() => {
    const el = targetElSignal();
    if (el) {
      update(true);
    } else {
      animate.set(undefined);
    }
  });

  // Watch keyframes changes (equivalent to Vue watch with deep: true)
  const kfSignal = computed(() => keyframes);
  effect(() => {
    const value = kfSignal();
    const anim = animate();
    if (anim) {
      update();

      const targetEl = unrefElement(target);
      if (targetEl) {
        anim.effect = new KeyframeEffect(
          targetEl,
          (value ?? null) as Keyframe[] | PropertyIndexedKeyframes | null,
          animateOptions,
        );
      }
    }
  });

  tryOnMounted(() => update(true), false);

  tryOnScopeDispose(cancel);

  function update(init?: boolean) {
    const el = unrefElement(target);
    if (!isSupported() || !el) return;

    let anim = animate();
    if (!anim)
      anim = el.animate(
        toValue(keyframes) as Keyframe[] | PropertyIndexedKeyframes | null,
        animateOptions,
      );

    if (persist && anim) anim.persist();
    if (_playbackRate !== 1 && anim) anim.playbackRate = _playbackRate;

    if (init && !immediate && anim) anim.pause();
    else syncResume();

    onReady?.(anim);
  }

  const listenerOptions = { passive: true };
  useEventListener(animate, ['cancel', 'finish', 'remove'], syncPause, listenerOptions);
  useEventListener(
    animate,
    'finish',
    () => {
      if (commitStyles) animate()?.commitStyles();
    },
    listenerOptions,
  );

  const { resume: resumeRef, pause: pauseRef } = useRafFn(
    () => {
      const anim = animate();
      if (!anim) return;
      store.pending = anim.pending;
      store.playState = anim.playState;
      store.replaceState = anim.replaceState;
      store.startTime = anim.startTime;
      store.currentTime = anim.currentTime;
      store.timeline = anim.timeline;
      store.playbackRate = anim.playbackRate;
    },
    { immediate: false },
  );

  function syncResume() {
    if (isSupported()) resumeRef();
  }

  function syncPause() {
    if (isSupported() && window) window.requestAnimationFrame(pauseRef);
  }

  return {
    isSupported,
    animate,

    // actions
    play,
    pause,
    reverse,
    finish,
    cancel,

    // state
    pending,
    playState,
    replaceState,
    startTime,
    currentTime,
    timeline,
    playbackRate,
  };
}
