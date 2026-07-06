import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { runInInjectionContext } from '@angular/core';
import { createInjector } from '@cyia/ngx-vueuse/test';
import { useActiveElement } from './index';
import { userEvent } from 'vitest/browser';
import { waitForMicrotasks } from '@cyia/ngx-vueuse/test';

describe('useActiveElement', () => {
  let shadowHost: HTMLElement;
  let input: HTMLInputElement;
  let shadowInput: HTMLInputElement;
  let shadowRoot: ShadowRoot;
  let injector: ReturnType<typeof createInjector>;

  beforeEach(() => {
    shadowHost = document.createElement('div');
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    input = document.createElement('input');
    shadowInput = input.cloneNode() as HTMLInputElement;
    shadowRoot.appendChild(shadowInput);
    document.body.appendChild(input);
    document.body.appendChild(shadowHost);
    injector = createInjector();
  });

  afterEach(() => {
    shadowHost.remove();
    input.remove();
  });

  function runWithInjector<T>(fn: () => T): T {
    return runInInjectionContext(injector, fn);
  }

  it('should be defined', () => {
    expect(useActiveElement).toBeDefined();
  });

  it('should initialise correctly', () => {
    const activeElement = runWithInjector(() => useActiveElement());

    expect(activeElement()).toEqual(document.body);
  });

  it('should accept custom document', () => {
    const activeElement = runWithInjector(() => useActiveElement({}));

    expect(activeElement()).toBeDefined();
  });

  it('should observe focus/blur events', () => {
    const activeElement = runWithInjector(() => useActiveElement());

    expect(activeElement()).toBeDefined();
    expect(activeElement()).toEqual(document.body);
  });

  it('should update when activeElement is removed w/document', () => {
    const activeElement = runWithInjector(() => useActiveElement({ triggerOnRemoval: true }));

    expect(activeElement()).toBeDefined();

    input.remove();

    expect(activeElement()).toEqual(document.body);
  });

  it('should update when activeElement is removed w/shadowRoot', async () => {
    const activeElement = runWithInjector(() =>
      useActiveElement({ triggerOnRemoval: true, document: shadowRoot }),
    );
    await userEvent.fill(shadowInput, 'focus');

    expect(activeElement()).to.equal(shadowInput);

    shadowInput.remove();
    await waitForMicrotasks();
    expect(activeElement()).toEqual(null);
  });
});
