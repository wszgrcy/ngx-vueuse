import type { Signal } from '@angular/core';
import { computed, signal } from '@angular/core';
import type { ConfigurableDocument } from '../_configurable';
import type { Supportable } from '../types';
import type { MaybeElementRef } from '../unrefElement';
import { tryOnMounted } from '@cyia/ngx-vueuse/shared';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';
import { defaultDocument } from '../_configurable';
import { unrefElement } from '../unrefElement';
import { useEventListener } from '../useEventListener';
import { useSupported } from '../useSupported';

export interface UseFullscreenOptions extends ConfigurableDocument {
  /**
   * Automatically exit fullscreen when component is unmounted
   *
   * @default false
   */
  autoExit?: boolean;
}

export interface UseFullscreenReturn extends Supportable {
  isFullscreen: Signal<boolean>;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

const eventHandlers = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'webkitendfullscreen',
  'mozfullscreenchange',
  'MSFullscreenChange',
] as unknown as 'fullscreenchange'[];

/**
 * Reactive Fullscreen API.
 *
 * @see https://vueuse.org/useFullscreen
 * @param target
 * @param options
 */
export function useFullscreen(
  target?: MaybeElementRef,
  options: UseFullscreenOptions = {},
): UseFullscreenReturn {
  const { document = defaultDocument, autoExit = false } = options;

  const targetRef = computed(() => unrefElement(target) ?? document?.documentElement);
  const isFullscreen = signal(false);

  const requestMethod = computed<'requestFullscreen' | undefined>(
    () =>
      [
        'requestFullscreen',
        'webkitRequestFullscreen',
        'webkitEnterFullscreen',
        'webkitEnterFullScreen',
        'webkitRequestFullScreen',
        'mozRequestFullScreen',
        'msRequestFullscreen',
      ].find(
        (m) =>
          (document && m in document) ||
          (targetRef() && m in (targetRef() as unknown as Record<string, unknown>)),
      ) as 'requestFullscreen' | undefined,
  );

  const exitMethod = computed<'exitFullscreen' | undefined>(
    () =>
      [
        'exitFullscreen',
        'webkitExitFullscreen',
        'webkitExitFullScreen',
        'webkitCancelFullScreen',
        'mozCancelFullScreen',
        'msExitFullscreen',
      ].find(
        (m) =>
          (document && m in document) ||
          (targetRef() && m in (targetRef() as unknown as Record<string, unknown>)),
      ) as 'exitFullscreen' | undefined,
  );

  const fullscreenEnabled = computed<'fullscreenEnabled' | undefined>(
    () =>
      [
        'fullScreen',
        'webkitIsFullScreen',
        'webkitDisplayingFullscreen',
        'mozFullScreen',
        'msFullscreenElement',
      ].find(
        (m) =>
          (document && m in document) ||
          (targetRef() && m in (targetRef() as unknown as Record<string, unknown>)),
      ) as 'fullscreenEnabled' | undefined,
  );

  const fullscreenElementMethod = [
    'fullscreenElement',
    'webkitFullscreenElement',
    'mozFullScreenElement',
    'msFullscreenElement',
  ].find((m) => document && m in document) as 'fullscreenElement' | undefined;

  const isSupported = useSupported(
    () =>
      targetRef() &&
      document &&
      requestMethod() !== undefined &&
      exitMethod() !== undefined &&
      fullscreenEnabled() !== undefined,
  );

  const isCurrentElementFullScreen = (): boolean => {
    if (fullscreenElementMethod) return document?.[fullscreenElementMethod] === targetRef();
    return false;
  };

  const isElementFullScreen = (): boolean => {
    const fullscreenEnabledValue = fullscreenEnabled();
    if (fullscreenEnabledValue) {
      if (document && document[fullscreenEnabledValue] != null) {
        return document[fullscreenEnabledValue];
      } else {
        const target = targetRef();
        // @ts-expect-error - Fallback for WebKit and iOS Safari browsers
        if (target?.[fullscreenEnabledValue] != null) {
          // @ts-expect-error - Fallback for WebKit and iOS Safari browsers
          return Boolean(target[fullscreenEnabledValue]);
        }
      }
    }
    return false;
  };

  async function exit() {
    if (!isSupported() || !isFullscreen()) return;
    const exitMethodValue = exitMethod();
    if (exitMethodValue) {
      if (document?.[exitMethodValue] != null) {
        await document[exitMethodValue]();
      } else {
        const target = targetRef();
        // @ts-expect-error - Fallback for Safari iOS
        if (target?.[exitMethodValue] != null)
          // @ts-expect-error - Fallback for Safari iOS
          await target[exitMethodValue]();
      }
    }

    isFullscreen.set(false);
  }

  async function enter() {
    if (!isSupported() || isFullscreen()) return;

    if (isElementFullScreen()) await exit();

    const target = targetRef();
    const requestMethodValue = requestMethod();
    if (requestMethodValue && target?.[requestMethodValue] != null) {
      await target[requestMethodValue]();
      isFullscreen.set(true);
    }
  }

  async function toggle() {
    await (isFullscreen() ? exit() : enter());
  }

  const handlerCallback = () => {
    const isElementFullScreenValue = isElementFullScreen();
    if (!isElementFullScreenValue || (isElementFullScreenValue && isCurrentElementFullScreen()))
      isFullscreen.set(isElementFullScreenValue);
  };

  const listenerOptions = { capture: false, passive: true };
  useEventListener(document, eventHandlers, handlerCallback, listenerOptions);
  useEventListener(() => unrefElement(targetRef), eventHandlers, handlerCallback, listenerOptions);

  tryOnMounted(handlerCallback, false);

  if (autoExit) tryOnScopeDispose(exit);

  return {
    isSupported,
    isFullscreen,
    enter,
    exit,
    toggle,
  };
}
