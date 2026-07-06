import { signal, type Signal } from '@angular/core';
import { afterNextRender } from '@angular/core';

/**
 * Mounted state in signal.
 * In Angular, we use afterNextRender to detect when the component is mounted.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function useMounted(): Signal<boolean> {
  const isMounted = signal(false);

  afterNextRender(() => {
    isMounted.set(true);
  });

  return isMounted;
}
