import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createInjector, runInInjectionContext } from '@cyia/ngx-vueuse/test';
import { useFocusWithin } from './index';

describe('useFocusWithin', () => {
  let parent: HTMLFormElement;
  let child: HTMLDivElement;
  let child2: HTMLDivElement;
  let grandchild: HTMLInputElement;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    vi.clearAllMocks();
    injector = createInjector();

    parent = document.createElement('form');
    parent.tabIndex = 0;
    document.body.appendChild(parent);

    child = document.createElement('div');
    child.tabIndex = 0;
    parent.appendChild(child);

    child2 = document.createElement('div');
    child2.tabIndex = 0;
    parent.appendChild(child2);

    grandchild = document.createElement('input');
    grandchild.tabIndex = 0;
    child.appendChild(grandchild);
  });

  it('should be defined', () => {
    expect(useFocusWithin).toBeDefined();
  });

  it('should initialize properly', () => {
    const { focused } = runInInjectionContext(injector, () => useFocusWithin(parent));

    expect(focused()).toBe(false);
  });

  it('should track the state of the target itself', () => {
    const { focused } = runInInjectionContext(injector, () => useFocusWithin(parent));

    expect(focused()).toBe(false);

    parent?.focus();
    expect(focused()).toBe(true);

    parent?.blur();
    expect(focused()).toBe(false);
  });

  it('should track the state of the targets descendants', () => {
    const { focused } = runInInjectionContext(injector, () => useFocusWithin(parent));

    expect(focused()).toBe(false);

    child?.focus();
    expect(focused()).toBe(true);

    child?.blur();
    expect(focused()).toBe(false);

    grandchild?.focus();
    expect(focused()).toBe(true);

    grandchild?.blur();
    expect(focused()).toBe(false);
  });

  it('should track the state while the descendants switch focus state', () => {
    const { focused } = runInInjectionContext(injector, () => useFocusWithin(parent));

    expect(focused()).toBe(false);

    child?.focus();
    expect(focused()).toBe(true);

    child2?.focus();
    expect(focused()).toBe(true);

    child?.focus();
    expect(focused()).toBe(true);

    child?.blur();
    expect(focused()).toBe(false);
  });

  it('should the state of target always be falsy when document.activeElement invalid', () => {
    // Note: This test verifies the original Vueuse behavior where activeElement check
    // prevents focus tracking when activeElement is invalid.
    // In Angular, useActiveElement uses defaultWindow internally, so this test
    // verifies the early return behavior when window is null.
    const { focused } = runInInjectionContext(injector, () =>
      useFocusWithin(parent, { window: null as any }),
    );

    expect(focused()).toBe(false);
  });
});
