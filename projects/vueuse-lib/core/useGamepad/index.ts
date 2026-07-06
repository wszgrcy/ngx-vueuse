import type { Pausable } from '@cyia/ngx-vueuse/shared';
import type { EventHookOn } from '@cyia/ngx-vueuse/shared';
import type { Signal } from '@angular/core';
import type { ConfigurableNavigator, ConfigurableWindow } from '../_configurable';
import type { Supportable } from '../types';
import { createEventHook } from '@cyia/ngx-vueuse/shared';
import { signal, computed, afterNextRender, DestroyRef, inject } from '@angular/core';
import { defaultNavigator } from '../_configurable';
import { useEventListener } from '../useEventListener';
import { useRafFn } from '../useRafFn';
import { useSupported } from '../useSupported';
import { tryOnScopeDispose } from '@cyia/ngx-vueuse/shared';

export interface UseGamepadOptions extends ConfigurableWindow, ConfigurableNavigator {}

export interface UseGamepadReturn extends Supportable, Pausable {
  onConnected: EventHookOn<number>;
  onDisconnected: EventHookOn<number>;
  gamepads: Signal<Gamepad[]>;
}

/**
 * Maps a standard standard gamepad to an Xbox 360 Controller.
 */
export function mapGamepadToXbox360Controller(gamepad: Signal<Gamepad | undefined>) {
  return computed(() => {
    const gp = gamepad();
    if (gp) {
      return {
        buttons: {
          a: gp.buttons[0],
          b: gp.buttons[1],
          x: gp.buttons[2],
          y: gp.buttons[3],
        },
        bumper: {
          left: gp.buttons[4],
          right: gp.buttons[5],
        },
        triggers: {
          left: gp.buttons[6],
          right: gp.buttons[7],
        },
        stick: {
          left: {
            horizontal: gp.axes[0],
            vertical: gp.axes[1],
            button: gp.buttons[10],
          },
          right: {
            horizontal: gp.axes[2],
            vertical: gp.axes[3],
            button: gp.buttons[11],
          },
        },
        dpad: {
          up: gp.buttons[12],
          down: gp.buttons[13],
          left: gp.buttons[14],
          right: gp.buttons[15],
        },
        back: gp.buttons[8],
        start: gp.buttons[9],
      };
    }

    return null;
  });
}

/* @__NO_SIDE_EFFECTS__ */
export function useGamepad(options: UseGamepadOptions = {}): UseGamepadReturn {
  const { navigator = defaultNavigator } = options;
  const isSupported = useSupported(() => navigator && 'getGamepads' in navigator);
  const gamepads = signal<Gamepad[]>([]);

  const onConnectedHook = createEventHook<number>();
  const onDisconnectedHook = createEventHook<number>();

  const stateFromGamepad = (gamepad: Gamepad) => {
    const hapticActuators = [];
    const vibrationActuator =
      'vibrationActuator' in gamepad ? (gamepad as Gamepad).vibrationActuator : null;

    if (vibrationActuator) hapticActuators.push(vibrationActuator);

    // @ts-expect-error missing in types
    if (gamepad.hapticActuators)
      // @ts-expect-error missing in types
      hapticActuators.push(...gamepad.hapticActuators);

    return {
      id: gamepad.id,
      index: gamepad.index,
      connected: gamepad.connected,
      mapping: gamepad.mapping,
      timestamp: gamepad.timestamp,
      vibrationActuator: gamepad.vibrationActuator,
      hapticActuators,
      axes: gamepad.axes.map((axes) => axes),
      buttons: gamepad.buttons.map((button) => ({
        pressed: button.pressed,
        touched: button.touched,
        value: button.value,
      })),
    } as Gamepad;
  };

  const updateGamepadState = () => {
    const _gamepads = navigator?.getGamepads() || [];

    for (const gamepad of _gamepads) {
      if (gamepad && gamepads()[gamepad.index])
        gamepads.update((gps) => {
          const result = [...gps];
          result[gamepad.index] = stateFromGamepad(gamepad);
          return result;
        });
    }
  };

  const { isActive, pause, resume } = useRafFn(updateGamepadState);

  const onGamepadConnected = (gamepad: Gamepad) => {
    if (!gamepads().some(({ index }) => index === gamepad.index)) {
      gamepads.update((gps) => [...gps, stateFromGamepad(gamepad)]);
      onConnectedHook.trigger(gamepad.index);
    }

    resume();
  };

  const onGamepadDisconnected = (gamepad: Gamepad) => {
    gamepads.update((gps) => gps.filter((x) => x.index !== gamepad.index));
    onDisconnectedHook.trigger(gamepad.index);
  };

  const listenerOptions = { passive: true };
  useEventListener('gamepadconnected', (e) => onGamepadConnected(e.gamepad), listenerOptions);
  useEventListener('gamepaddisconnected', (e) => onGamepadDisconnected(e.gamepad), listenerOptions);

  tryOnScopeDispose(onConnectedHook.clear);
  tryOnScopeDispose(onDisconnectedHook.clear);

  // Simulate tryOnMounted: run initialization immediately if not in injection context
  const initGamepads = () => {
    const _gamepads = navigator?.getGamepads() || [];

    for (const gamepad of _gamepads) {
      if (gamepad && gamepads()[gamepad.index]) onGamepadConnected(gamepad);
    }
  };

  try {
    inject(DestroyRef);
    // In injection context, run after next render to match Angular lifecycle
    afterNextRender(initGamepads);
  } catch {
    // Not in injection context, run immediately
    initGamepads();
  }

  pause();

  return {
    isSupported,
    onConnected: onConnectedHook.on,
    onDisconnected: onDisconnectedHook.on,
    gamepads,
    pause,
    resume,
    isActive,
  };
}
