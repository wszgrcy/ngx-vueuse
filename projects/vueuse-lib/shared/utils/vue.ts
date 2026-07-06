import { inject, EnvironmentInjector, InjectionToken } from '@angular/core';

export type Fn = () => void;

/**
 * Get the current Angular injection context.
 * In VueUse this used Vue's getCurrentInstance(), but for Angular we use the injector.
 */
export function getLifeCycleTarget(injector?: EnvironmentInjector | null) {
  return injector || inject(EnvironmentInjector, { optional: true });
}

/**
 * Create an Angular-specific injection token for lifecycle target.
 */
export const LIFECYCLE_TARGET_TOKEN = new InjectionToken<EnvironmentInjector>('LIFECYCLE_TARGET');
